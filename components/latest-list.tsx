"use client"

import { useLibrary } from "@/lib/store"
import PaperCard from "@/components/paper-card"
import { Skeleton } from "@/components/ui/skeleton"
import { useEffect, useState } from "react"

export function LatestListSkeleton() {
  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold">Recent Papers</h2>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 space-y-4">
            <Skeleton className="h-5 w-4/5" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    </section>
  )
}

export function LatestList() {
  const { papers } = useLibrary()
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return <LatestListSkeleton />
  }

  const recentPapers = papers.slice(0, 6)

  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold">Recent Papers</h2>
      {recentPapers.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {recentPapers.map((p) => (
            <PaperCard key={p.id} paper={p} />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 border border-dashed rounded-lg">
          <p className="text-muted-foreground">No recent papers found in your library.</p>
          <p className="text-sm text-muted-foreground mt-1">Upload a paper to get started!</p>
        </div>
      )}
    </section>
  )
}

export default LatestList
