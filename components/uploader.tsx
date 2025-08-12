"use client"

import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { extractPdf } from "@/file-processing/pdf"
import { useLibrary } from "@/lib/store"
import type { PaperMeta, Paper } from "@/lib/types"
import { FileUp, CheckCircle2, AlertTriangle, Eye } from 'lucide-react'
import AnalysisResultModal from "./analysis-result-modal"

type UploadItem = {
  file: File
  status: "pending" | "parsing" | "analyzing" | "done" | "error"
  progress: number
  message?: string
  paperId?: string
  paper?: Paper
}

export default function Uploader({ compact = false }: { compact?: boolean }) {
  const [items, setItems] = useState<UploadItem[]>([])
  const { addPaper, setAnalysis, papers } = useLibrary()
  const [processing, setProcessing] = useState(false)
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null)
  const [showModal, setShowModal] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const next = acceptedFiles.map((file) => ({
      file,
      status: "pending" as const,
      progress: 0,
    }))
    setItems((prev) => [...next, ...prev])
  }, [])

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    multiple: true,
    accept: {
      "application/pdf": [".pdf"],
    },
    maxSize: 80 * 1024 * 1024,
  })

  const showResult = (paperId: string) => {
    const paper = papers.find(p => p.id === paperId)
    if (paper?.analysis) {
      setSelectedPaper(paper)
      setShowModal(true)
    }
  }

  const start = async () => {
    if (processing) return
    setProcessing(true)
    
    for (let idx = 0; idx < items.length; idx++) {
      const it = items[idx]
      if (it.status !== "pending") continue
      
      setItems((all) =>
        all.map((a, i) => (i === idx ? { ...a, status: "parsing", progress: 20 } : a))
      )
      
      try {
        const parsed = await extractPdf(it.file)
        
        const metaBase: Omit<PaperMeta, "id"> = {
          title: parsed.metadata.title || it.file.name,
          authors: parsed.metadata.authors?.length ? parsed.metadata.authors : ["Unknown"],
          abstract: parsed.text.slice(0, 1200),
          journal: undefined,
          publicationDate: undefined,
          filename: it.file.name,
          source: "upload",
          pages: parsed.pages,
        } as any
        
        const id = addPaper({ ...metaBase, text: parsed.text, pages: parsed.pages })
        
        setItems((all) =>
          all.map((a, i) =>
            i === idx ? { ...a, status: "analyzing", progress: 60, paperId: id } : a
          )
        )

        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ meta: { ...metaBase, id }, content: parsed.text }),
        })

        if (!res.ok) {
          const text = await res.text().catch(() => "")
          throw new Error(`Analysis failed: ${text.slice(0, 100)}`)
        }

        const json = await res.json()
        if (!json?.ok) {
          throw new Error(json?.error || "Analysis failed")
        }

        setAnalysis(id, json.analysis)
        
        // Get the updated paper with analysis
        const updatedPaper = papers.find(p => p.id === id)
        
        setItems((all) => all.map((a, i) => (i === idx ? { 
          ...a, 
          status: "done", 
          progress: 100,
          paper: updatedPaper 
        } : a)))

        // Auto-show result popup for the first completed analysis
        if (idx === 0) {
          setTimeout(() => {
            const finalPaper = papers.find(p => p.id === id)
            if (finalPaper?.analysis) {
              setSelectedPaper(finalPaper)
              setShowModal(true)
            }
          }, 500)
        }
        
      } catch (e: any) {
        setItems((all) =>
          all.map((a, i) =>
            i === idx ? { ...a, status: "error", message: e?.message ?? "Failed" } : a
          )
        )
      }
    }
    setProcessing(false)
  }

  const statusColor = (s: UploadItem["status"]) =>
    s === "done" ? "text-green-600" : s === "error" ? "text-red-600" : "text-muted-foreground"

  return (
    <>
      <div className="space-y-4">
        <Card className={`border-dashed ${isDragActive ? "border-green-400" : "border-muted-foreground/30"}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileUp className="h-5 w-5" />
              Fast Analysis - Key Findings & Limitations Only
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              {...getRootProps()}
              className={`flex flex-col items-center justify-center gap-2 rounded-md border border-dashed p-8 text-center cursor-pointer ${
                isDragActive ? "bg-green-50" : "bg-muted/20"
              }`}
            >
              <input {...getInputProps()} />
              <p className="text-sm">
                {isDragActive ? "Drop files here" : "Drag PDFs here or click to select"}
              </p>
              <p className="text-xs text-muted-foreground">
                Fast analysis - extracts only key findings and limitations
              </p>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <Badge variant="secondary">{`${items.length} file(s) queued`}</Badge>
              <Button onClick={start} disabled={!items.length || processing}>
                {processing ? 'Processing...' : 'Start Fast Analysis'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {items.length > 0 && (
          <div className="space-y-2">
            {items.map((it, i) => (
              <Card key={i}>
                <CardContent className="py-3">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{it.file.name}</div>
                      <div className={`text-xs ${statusColor(it.status)}`}>
                        {it.status === "parsing" && "Parsing PDF..."}
                        {it.status === "analyzing" && "Fast analysis..."}
                        {it.status === "done" && (
                          <span className="inline-flex items-center gap-1">
                            <CheckCircle2 className="h-4 w-4" /> Analysis complete!
                          </span>
                        )}
                        {it.status === "error" && (
                          <span className="inline-flex items-center gap-1">
                            <AlertTriangle className="h-4 w-4" /> {it.message ?? "Error"}
                          </span>
                        )}
                        {it.status === "pending" && "Queued"}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {it.status === "done" && it.paperId && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => showResult(it.paperId!)}
                          className="text-green-600 border-green-200 hover:bg-green-50"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View Results
                        </Button>
                      )}
                      <div className="w-32">
                        <Progress value={it.progress} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <AnalysisResultModal
        paper={selectedPaper}
        open={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  )
}
