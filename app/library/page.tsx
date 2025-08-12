"use client"

import SearchBar from "@/components/search-bar"
import PaperCard from "@/components/paper-card"
import { useLibrary } from "@/lib/store"
import { AppShell } from "@/components/app-sidebar"
import { useMemo, useState, Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import dynamic from "next/dynamic"
import AnalysisResultModal from "@/components/analysis-result-modal"

function LibraryPageContent() {
  const { papers, setAnalysis } = useLibrary()
  const [query, setQuery] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set())

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return papers.filter((p) => {
      const hay = [p.title, p.abstract, p.journal, ...(p.authors || [])].join(" ").toLowerCase()
      const passQ = !q || hay.includes(q)
      const passTags = !tags.length || tags.some((t) => p.subspecialties?.includes(t))
      return passQ && passTags
    })
  }, [papers, query, tags])

  const analyzePaper = async (paperId: string) => {
    const p = papers.find((x) => x.id === paperId)
    if (!p) return
    
    // If analysis already exists, show it immediately without API call
    if (p.analysis) {
      setSelected(p.id)
      setOpen(true)
      return
    }

    setLoadingIds((prev) => new Set([...Array.from(prev), paperId]))
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meta: {
            id: p.id,
            title: p.title,
            authors: p.authors,
            abstract: p.abstract || "",
            journal: p.journal,
            publicationDate: p.publicationDate,
          },
          content: p.text || p.abstract || "",
        }),
      })
      if (!res.ok) {
        const t = await res.text().catch(() => "")
        throw new Error(t || "Failed to analyze")
      }
      const json = await res.json()
      if (!json?.ok) throw new Error(json?.error || "Failed to analyze")
      setAnalysis(p.id, json.analysis)
      setSelected(p.id)
      setOpen(true)
    } catch (e) {
      console.error(e)
      alert("Analysis failed. Please try again.")
    } finally {
      setLoadingIds((prev) => {
        const next = new Set(prev)
        next.delete(paperId)
        return next
      })
    }
  }

  const selectedPaper = selected ? (papers.find((p) => p.id === selected) ?? null) : null

  return (
    <div className="space-y-6">
      <SearchBar
        onSearch={(q, t) => {
          setQuery(q)
          setTags(t)
        }}
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((p) => (
          <PaperCard
            key={p.id}
            paper={p}
            onAnalyze={async () => analyzePaper(p.id)}
            onViewOriginal={(paper) => {
              if (paper.sourceUrl) {
                window.open(paper.sourceUrl, "_blank", "noopener,noreferrer")
              } else {
                alert("No source URL available for this paper.")
              }
            }}
          />
        ))}
      </div>

      <AnalysisResultModal paper={selectedPaper} open={open} onClose={() => setOpen(false)} />
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <div className="flex flex-wrap gap-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-6 w-24" />
          ))}
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 space-y-4">
            <Skeleton className="h-5 w-4/5" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    </div>
  )
}

const DynamicLibraryPage = dynamic(() => Promise.resolve(LibraryPageContent), {
  ssr: false,
})

export default function Page() {
  return (
    <AppShell>
      <Suspense fallback={<LoadingSkeleton />}>
        <DynamicLibraryPage />
      </Suspense>
    </AppShell>
  )
}
