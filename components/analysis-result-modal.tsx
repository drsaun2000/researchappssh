"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2, AlertTriangle, Copy, X, FileDown } from "lucide-react"
import type { Variants, Transition } from "@/components/motion-wrapper"
import type { Paper } from "@/lib/types"

interface AnalysisResultModalProps {
  paper: Paper | null
  open: boolean
  onClose: () => void
}

export default function AnalysisResultModal({ paper, open, onClose }: AnalysisResultModalProps) {
  if (!paper?.analysis) return null
  const a = paper.analysis

  const customVariants: Variants = {
    initial: {
      opacity: 0,
      scale: 0.95,
      y: 40,
    },
    animate: {
      opacity: 1,
      scale: 1,
      y: 0,
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: 40,
    },
  }

  const customTransition: Transition = {
    type: "spring",
    bounce: 0,
    duration: 0.25,
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const bulletify = (str?: string): string[] => {
    if (!str) return []
    // Simple sentence split fallback
    const parts = str
      .split(/[.\n]\s+/)
      .map((s) => s.trim())
      .filter(Boolean)
    return parts.slice(0, 5)
  }

  const keyFindings = (a.keyFindings?.length ? a.keyFindings : bulletify(a.findings)).slice(0, 5)
  const confidence =
    typeof a.confidenceScore === "number"
      ? Math.round(a.confidenceScore)
      : typeof a.confidence === "number"
        ? Math.round(a.confidence * 100)
        : 55

  const exportToPDF = () => {
    const content = `
AI Analysis Results
Paper: ${paper.title}
Authors: ${paper.authors.join(", ")}
Journal: ${paper.journal ?? ""} • ${paper.publicationDate ?? ""}

Key Findings:
- ${keyFindings.join("\n- ")}

Methodology:
${a.methodology || "—"}

Clinical Relevance:
${a.clinicalRelevance || "—"}

Limitations:
${a.limitations || "—"}

Evidence Level: ${a.evidenceLevel || "—"}
Confidence: ${confidence}%
Analyzed by: ${a.model ?? "model"} on ${new Date(a.createdAt).toLocaleString()}
`.trim()

    // Create a simple printable document
    const win = window.open("", "_blank", "noopener,noreferrer")
    if (!win) return
    win.document.write(`
      <html>
        <head>
          <title>AI Analysis - ${paper.title}</title>
          <style>
            body { font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; padding: 24px; color: #111; }
            h1, h2 { margin: 0 0 8px; }
            h1 { font-size: 20px; }
            h2 { font-size: 16px; margin-top: 16px; }
            .meta { color: #555; margin-bottom: 12px; }
            .badge { display: inline-block; padding: 2px 8px; border-radius: 9999px; border: 1px solid #cbd5e1; color: #1e293b; font-size: 12px; }
            ul { margin: 8px 0 16px 20px; }
            li { margin-bottom: 6px; }
          </style>
        </head>
        <body>
          <h1>AI Analysis Results</h1>
          <div class="meta">${paper.title}</div>
          <div class="meta">${paper.authors.join(", ")} • ${paper.journal ?? ""} • ${paper.publicationDate ?? ""}</div>
          <div class="badge">${a.evidenceLevel || "—"}</div>

          <h2>Key Findings</h2>
          <ul>
            ${keyFindings.map((f) => `<li>${f}</li>`).join("")}
          </ul>

          <h2>Methodology</h2>
          <div>${(a.methodology || "—").replace(/\n/g, "<br/>")}</div>

          <h2>Clinical Relevance</h2>
          <div>${(a.clinicalRelevance || "—").replace(/\n/g, "<br/>")}</div>

          <h2>Limitations</h2>
          <div>${(a.limitations || "—").replace(/\n/g, "<br/>")}</div>

          <h2>Details</h2>
          <div>Confidence: ${confidence}% • Model: ${a.model ?? "model"} • ${new Date(a.createdAt).toLocaleString()}</div>

          <script>
            window.onload = () => { window.print(); }
          </script>
        </body>
      </html>
    `)
    win.document.close()
  }

  const copyFullAnalysis = () => {
    const fullText = `
AI ANALYSIS RESULTS

PAPER: ${paper.title}
AUTHORS: ${paper.authors.join(", ")}
JOURNAL: ${paper.journal ?? ""} • ${paper.publicationDate ?? ""}

KEY FINDINGS:
${keyFindings.map((f, i) => `${i + 1}. ${f}`).join("\n")}

METHODOLOGY:
${a.methodology || "—"}

CLINICAL RELEVANCE:
${a.clinicalRelevance || "—"}

LIMITATIONS:
${a.limitations || "—"}

EVIDENCE LEVEL: ${a.evidenceLevel || "—"}
CONFIDENCE: ${confidence}%
Analyzed by: ${a.model ?? "model"} on ${new Date(a.createdAt).toLocaleString()}
    `.trim()
    copyToClipboard(fullText)
  }

  return (
    <Dialog open={open} onOpenChange={onClose} variants={customVariants} transition={customTransition}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <DialogTitle className="text-lg">AI Analysis Results</DialogTitle>
              <DialogDescription className="mt-1 text-foreground">{paper.title}</DialogDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close analysis dialog">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span>
              {paper.authors.slice(0, 3).join(", ")}
              {paper.authors.length > 3 ? ", et al." : ""}
            </span>
            {paper.journal && (
              <>
                <span>•</span>
                <span>{paper.journal}</span>
              </>
            )}
            {paper.publicationDate && (
              <>
                <span>•</span>
                <span>{paper.publicationDate}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-green-200 text-green-700 dark:text-green-200">
              ✨ Analysis Complete
            </Badge>
            {a.model && <Badge variant="secondary">{a.model}</Badge>}
            {a.evidenceLevel && (
              <Badge variant="outline" className="border-blue-200 text-blue-700 dark:text-blue-200">
                {a.evidenceLevel}
              </Badge>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Key Findings */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/20">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </div>
              <h3 className="font-semibold text-base">Key Findings</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(keyFindings.join("\n"))}
                className="ml-auto"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
            <ul className="ml-10 list-disc pl-4 space-y-2 text-sm">
              {keyFindings.map((f, i) => (
                <li key={i} className="text-foreground/90">
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Methodology */}
          <div className="space-y-2">
            <h3 className="font-semibold text-base">Study Methodology</h3>
            <div className="p-4 rounded-lg border bg-muted/50 text-sm">
              {a.methodology || <span className="text-muted-foreground">No methodology extracted.</span>}
            </div>
          </div>

          {/* Clinical Relevance */}
          <div className="space-y-2">
            <h3 className="font-semibold text-base">Clinical Relevance</h3>
            <div className="p-4 rounded-lg border bg-muted/50 text-sm">
              {a.clinicalRelevance || <span className="text-muted-foreground">No clinical relevance extracted.</span>}
            </div>
          </div>

          {/* Limitations */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/20">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
              </div>
              <h3 className="font-semibold text-base">Limitations</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(a.limitations || "")}
                className="ml-auto"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
            <div className="ml-10 p-4 rounded-lg bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800">
              <p className="text-sm leading-relaxed text-orange-900 dark:text-orange-100">{a.limitations}</p>
            </div>
          </div>

          {/* Evidence + Confidence */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <h4 className="text-sm font-medium mb-2">Confidence Score</h4>
              <Progress value={confidence} />
              <div className="text-xs text-muted-foreground mt-1">{confidence}%</div>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-2">Evidence Level</h4>
              <Badge variant="secondary" className="w-fit">
                {a.evidenceLevel || "—"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-6 border-t mt-6">
          <div className="flex gap-2">
            <Button variant="outline" onClick={copyFullAnalysis} aria-label="Copy full analysis">
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </Button>
            <Button variant="outline" onClick={exportToPDF} aria-label="Export analysis to PDF">
              <FileDown className="h-4 w-4 mr-2" />
              Export to PDF
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button onClick={onClose}>Save Analysis</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
