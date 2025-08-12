"use client"

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Bookmark, BookmarkCheck, ExternalLink, AlertTriangle, CheckCircle2, Brain } from "lucide-react"
import type { Paper } from "@/lib/types"
import { useLibrary } from "@/lib/store"
import { useState } from "react"

type Props = {
  paper: Paper
  onAnalyze?: (paper: Paper) => Promise<void> | void
  onViewOriginal?: (paper: Paper) => void
}

export default function PaperCard({ paper, onAnalyze, onViewOriginal }: Props) {
  const { toggleBookmark } = useLibrary()
  const tags = paper.subspecialties?.length ? paper.subspecialties : ["Physical Therapy"]
  const [loadingAnalyze, setLoadingAnalyze] = useState(false)

  const handleView = () => {
    if (onViewOriginal) return onViewOriginal(paper)
    if (paper.sourceUrl) {
      window.open(paper.sourceUrl, "_blank", "noopener,noreferrer")
    }
  }

  const handleAnalyze = async () => {
    if (onAnalyze) return onAnalyze(paper)
    // Optional default behavior: do nothing; parent handles it.
  }

  return (
    <Card>
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-base leading-tight">{paper.title}</CardTitle>
          <Button variant="ghost" size="icon" onClick={() => toggleBookmark(paper.id)} aria-label="Toggle bookmark">
            {paper.bookmarked ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
          </Button>
        </div>
        <div className="text-xs text-muted-foreground">
          {paper.authors.slice(0, 3).join(", ")}
          {paper.authors.length > 3 ? ", et al." : ""} • {paper.journal ?? "Unknown Journal"} •{" "}
          {paper.publicationDate ?? "n.d."}
        </div>
        <div className="flex flex-wrap gap-1">
          {tags.slice(0, 4).map((t) => (
            <Badge key={t} variant="secondary">
              {t}
            </Badge>
          ))}
        </div>
      </CardHeader>
      <CardContent className="text-sm space-y-3">
        <p className="line-clamp-2">{paper.abstract}</p>
        {paper.analysis && (
          <div className="space-y-2 text-xs">
            <div className="rounded-md border p-2">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                <span className="font-medium">Key Findings</span>
              </div>
              <p className="text-muted-foreground">{paper.analysis.findings}</p>
            </div>
            <div className="rounded-md border p-2">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="h-3.5 w-3.5 text-orange-600" />
                <span className="font-medium">Limitations</span>
              </div>
              <p className="text-muted-foreground">{paper.analysis.limitations}</p>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex items-center justify-between gap-2">
        <Button variant="default" className="gap-1" disabled={!paper.sourceUrl} onClick={handleView}>
          View Original
          <ExternalLink className="ml-1 h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          className="gap-1 bg-transparent"
          onClick={async () => {
            setLoadingAnalyze(true)
            try {
              await handleAnalyze()
            } finally {
              setLoadingAnalyze(false)
            }
          }}
        >
          <Brain className="h-4 w-4 mr-1" />
          {loadingAnalyze ? "Analyzing..." : paper.analysis ? "View Analysis" : "Analyze"}
        </Button>
      </CardFooter>
    </Card>
  )
}
