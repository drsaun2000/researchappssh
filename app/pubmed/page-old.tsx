"use client"

import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useLibrary } from "@/lib/store"

type PubItem = {
  id: string
  pmid?: string
  title: string
  authors: string[]
  journal?: string
  publicationDate?: string
  abstract?: string
}

export default function Page() {
  const [q, setQ] = useState("physical therapy randomized")
  const [items, setItems] = useState<PubItem[]>([])
  const [loading, setLoading] = useState(false)
  const { addPaper } = useLibrary()

  const search = async () => {
    setLoading(true)
    const res = await fetch(`/api/pubmed/search?q=${encodeURIComponent(q)}&max=12`)
    const json = await res.json()
    setItems(json.items || [])
    setLoading(false)
  }

  const toPubMed = (it: PubItem) => `https://pubmed.ncbi.nlm.nih.gov/${it.pmid || it.id}/`

  const importToLibrary = (it: PubItem) => {
    const id = addPaper({
      title: it.title,
      authors: it.authors?.length ? it.authors : ["Unknown"],
      abstract: it.abstract || "",
      journal: it.journal,
      publicationDate: it.publicationDate,
      source: "pubmed",
      sourceUrl: toPubMed(it),
    } as any)
    alert("Imported to your library.")
  }

  useEffect(() => {
    search()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>{"Explore the most recent research papers on physical therapy."}</CardTitle>
          <div className="flex gap-2">
            <Input value={q} onChange={(e) => setQ(e.target.value)} className="w-72" />
            <Button onClick={search} disabled={loading}>
              {loading ? "Searching..." : "Search"}
            </Button>
          </div>
        </CardHeader>
      </Card>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((it) => (
          <Card
            key={it.id}
            className="transition-all duration-200 hover:shadow-lg hover:scale-[1.02] hover:border-primary/50 dark:hover:border-primary/80 cursor-pointer group"
            role="link"
            tabIndex={0}
            aria-label={`Open on PubMed: ${it.title}`}
            onClick={() => window.open(toPubMed(it), "_blank", "noopener,noreferrer")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                window.open(toPubMed(it), "_blank", "noopener,noreferrer")
              }
            }}
          >
            <CardHeader>
              <CardTitle className="text-base group-hover:text-primary transition-colors duration-200">
                {it.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-xs text-muted-foreground group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors duration-200">
                {(it.authors || []).slice(0, 4).join(", ")} {it.authors?.length! > 4 ? ", et al." : ""} •{" "}
                {it.journal ?? "Journal"} • {it.publicationDate ?? "n.d."}
              </div>
              <p className="text-sm line-clamp-3 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors duration-200">
                {it.abstract || "No abstract available."}
              </p>
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation()
                    importToLibrary(it)
                  }}
                  className="group-hover:bg-primary/10 group-hover:border-primary/30 group-hover:text-primary dark:group-hover:bg-primary/20 dark:group-hover:border-primary/50 dark:group-hover:text-primary-foreground transition-all duration-200"
                >
                  {"Add to Library"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        </div>
      )}
      
      {!loading && items.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No papers found for the selected domain. Try refreshing or selecting a different domain.
          </CardContent>
        </Card>
      )}
    </div>
  )
}
