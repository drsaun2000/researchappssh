"use client"

import { useMemo, useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { useLibrary } from "@/lib/store"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { CalendarDays, BookPlus, Check, Search, Filter, Database, Stethoscope, BookOpen, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { useResearchData } from "@/lib/hooks/useResearchData"
import { ResearchSource } from "@/app/api/research/articles/route"
import { AppShell } from "@/components/app-sidebar"

type ArticleType =
  | "Randomized Controlled Trial"
  | "Systematic Review"
  | "Meta-Analysis"
  | "Cohort"
  | "Case Study"
  | "Clinical Practice Guideline"

type Specialty = "Orthopedic" | "Neurological" | "Pediatric" | "Geriatric" | "Sports Medicine" | "Cardiopulmonary"

type Source = ResearchSource

type Article = {
  id: string
  title: string
  authors: string[]
  journal: string
  date: string // ISO
  type: ArticleType
  specialty: Specialty
  source: Source
  abstract: string
  doi?: string
  url?: string
  keywords?: string[]
}

// Research sources available for physical therapy literature
const RESEARCH_SOURCES: ResearchSource[] = [
  'PEDro',
  'PubMed', 
  'Cochrane Library',
  'CINAHL',
  'Embase',
  'Scopus',
  'Web of Science',
  'SPORTDiscus'
]

const ARTICLE_TYPES: ArticleType[] = [
  "Randomized Controlled Trial",
  "Systematic Review",
  "Meta-Analysis",
  "Cohort",
  "Case Study",
  "Clinical Practice Guideline",
]

const SPECIALTIES: Specialty[] = [
  "Orthopedic",
  "Neurological",
  "Pediatric",
  "Geriatric",
  "Sports Medicine",
  "Cardiopulmonary",
]

const SOURCES: Source[] = RESEARCH_SOURCES

// Helper to parse varied date formats from PubMed
function parsePubDate(pubDate?: string): Date | null {
  if (!pubDate) return null
  const date = new Date(pubDate)
  return isNaN(date.getTime()) ? null : date
}

// Helper to check if a date is within the selected range
function withinDate(dateISO: string, range: "any" | "1" | "5" | "10") {
  if (range === "any") return true
  const years = Number.parseInt(range, 10)
  const cutoff = new Date()
  cutoff.setFullYear(cutoff.getFullYear() - years)
  return new Date(dateISO) >= cutoff
}

// Helper for relevance scoring
function relevanceScore(a: Article, q: string) {
  if (!q.trim()) return 0
  const hay = [a.title, a.abstract, a.journal, ...a.authors].join(" ").toLowerCase()
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean)
  let score = 0
  for (const t of terms) {
    const occurrences = hay.split(t).length - 1
    score += occurrences
  }
  return score
}

function typeBadgeColor(t: ArticleType) {
  switch (t) {
    case "Randomized Controlled Trial":
      return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-200 dark:border-blue-800"
    case "Systematic Review":
      return "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-200 dark:border-emerald-800"
    case "Meta-Analysis":
      return "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/20 dark:text-violet-200 dark:border-violet-800"
    case "Clinical Practice Guideline":
      return "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-200 dark:border-rose-800"
    case "Cohort":
      return "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-200 dark:border-amber-800"
    case "Case Study":
      return "bg-slate-200 text-slate-800 border-slate-300 dark:bg-slate-800/40 dark:text-slate-200 dark:border-slate-700"
    default:
      return ""
  }
}

export default function ExplorePage() {
  // Search and filters
  const [q, setQ] = useState("physical therapy")
  const [debouncedQuery, setDebouncedQuery] = useState("physical therapy")
  const [dateRange, setDateRange] = useState<"any" | "1" | "5" | "10">("any")
  const [types, setTypes] = useState<Set<ArticleType>>(new Set())
  const [specialties, setSpecialties] = useState<Set<Specialty>>(new Set())
  const [sources, setSources] = useState<Set<Source>>(new Set())
  const [sort, setSort] = useState<"newest" | "oldest" | "relevance">("newest")
  const { addPaper } = useLibrary()
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  
  // Fetch research data from API
  const { articles: apiArticles, loading, error, refetch } = useResearchData({
    query: debouncedQuery,
    sources: sources.size > 0 ? Array.from(sources) : [],
    limit: 100
  })
  
  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(q)
    }, 500)
    
    return () => clearTimeout(timer)
  }, [q])

  const toggleFilter = <T extends string>(set: Set<T>, item: T, setter: (s: Set<T>) => void) => {
    const next = new Set(set)
    if (next.has(item)) next.delete(item)
    else next.add(item)
    setter(next)
  }

  const filtered = useMemo(() => {
    const base = apiArticles.filter((a) => {
      const passDate = withinDate(a.date, dateRange)
      const passType = types.size === 0 || types.has(a.type)
      const passSpec = specialties.size === 0 || specialties.has(a.specialty)
      // Don't filter by source here since we're already filtering at API level
      return passDate && passType && passSpec
    })

    const sorted = [...base]
    if (sort === "newest") {
      sorted.sort((a, b) => +new Date(b.date) - +new Date(a.date))
    } else if (sort === "oldest") {
      sorted.sort((a, b) => +new Date(a.date) - +new Date(b.date))
    } else {
      // relevance
      sorted.sort((a, b) => relevanceScore(b, debouncedQuery) - relevanceScore(a, debouncedQuery))
    }
    return sorted
  }, [apiArticles, dateRange, types, specialties, sort, debouncedQuery])

  const saveToLibrary = (a: Article) => {
    if (savedIds.has(a.id)) return
    addPaper({
      title: a.title,
      authors: a.authors,
      abstract: a.abstract,
      journal: a.journal,
      publicationDate: a.date,
      source: "pubmed", // Keep source consistent for now
      subspecialties: [a.specialty],
    } as any)
    setSavedIds(new Set([...Array.from(savedIds), a.id]))
  }

  const handlePaperClick = (a: Article) => {
    if (a.url) {
      window.open(a.url, '_blank')
    } else if (a.doi) {
      window.open(`https://doi.org/${a.doi}`, '_blank')
    } else {
      // Fallback to library view or show modal
      console.log('Opening paper:', a.title)
    }
  }

  const resetFilters = () => {
    setDateRange("any")
    setTypes(new Set())
    setSpecialties(new Set())
    setSources(new Set())
  }

  return (
    <AppShell>
      <div className="space-y-10">
      {/* Header */}
      <section className="relative overflow-hidden rounded-xl border" aria-label="PT Literature Hub Header">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500" />
        <div className="relative p-8 md:p-10 text-white">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">PT Literature Hub</h1>
          <p className="mt-2 text-white/90 max-w-2xl">
            Explore the world's leading PT research databases, journals, and clinical guidelines.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/80" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by keyword, author, or journal..."
                aria-label="Search research"
                className="pl-9 bg-white/95 text-slate-900 placeholder:text-slate-500 focus-visible:ring-white/50 focus-visible:border-white"
              />
            </div>
            <Button
              className="bg-white text-blue-700 hover:bg-white/90"
              onClick={refetch}
              disabled={loading}
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              {loading ? "Searching..." : "Refresh"}
            </Button>
          </div>
        </div>
      </section>

      {/* Main layout */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Filters */}
        <aside className="md:col-span-3">
          <div className="md:sticky md:top-24 space-y-4">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Filter className="h-4 w-4 text-primary" />
                  {"Filters"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Date */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-primary" />
                    Publication Date
                  </Label>
                  <Select value={dateRange} onValueChange={(v) => setDateRange(v as any)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Any time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any time</SelectItem>
                      <SelectItem value="1">Last 1 year</SelectItem>
                      <SelectItem value="5">Last 5 years</SelectItem>
                      <SelectItem value="10">Last 10 years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Article Type */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-primary" />
                    Article Type
                  </Label>
                  <div className="space-y-2">
                    {ARTICLE_TYPES.map((t) => (
                      <label key={t} className="flex items-center gap-2">
                        <Checkbox
                          checked={types.has(t)}
                          onCheckedChange={() => toggleFilter(types, t, setTypes)}
                          aria-label={t}
                        />
                        <span className="text-sm">{t}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Specialty */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Stethoscope className="h-4 w-4 text-primary" />
                    Specialty
                  </Label>
                  <div className="space-y-2">
                    {SPECIALTIES.map((s) => (
                      <label key={s} className="flex items-center gap-2">
                        <Checkbox
                          checked={specialties.has(s)}
                          onCheckedChange={() => toggleFilter(specialties, s, setSpecialties)}
                          aria-label={s}
                        />
                        <span className="text-sm">{s}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Data Source */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Database className="h-4 w-4 text-primary" />
                    Data Source
                  </Label>
                  <div className="space-y-2">
                    {SOURCES.map((s) => (
                      <label key={s} className="flex items-center gap-2">
                        <Checkbox
                          checked={sources.has(s)}
                          onCheckedChange={() => toggleFilter(sources, s, setSources)}
                          aria-label={s}
                        />
                        <span className="text-sm">{s}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <Button variant="outline" className="w-full bg-transparent" onClick={resetFilters}>
                  Reset All Filters
                </Button>
              </CardContent>
            </Card>
          </div>
        </aside>

        {/* Results */}
        <div className="md:col-span-9 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="text-sm text-muted-foreground">
              {loading ? (
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Loading research articles...
                </div>
              ) : error ? (
                <div className="text-red-600">Error: {error}</div>
              ) : (
                <>Showing <span className="font-medium text-foreground">{filtered.length}</span> results</>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm">Sort</Label>
              <Select value={sort} onValueChange={(v) => setSort(v as any)}>
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Date: Newest</SelectItem>
                  <SelectItem value="oldest">Date: Oldest</SelectItem>
                  <SelectItem value="relevance">Relevance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="animate-pulse flex flex-col h-full">
                  <CardHeader className="space-y-3 pb-4">
                    <div className="space-y-2">
                      <div className="flex items-start justify-end">
                        <div className="h-5 bg-gray-200 rounded w-12 shrink-0"></div>
                      </div>
                      <div className="space-y-1">
                        <div className="h-4 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded w-4/5"></div>
                      </div>
                    </div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col gap-3 !pt-4">
                    <div className="flex items-center gap-2 w-full">
                      <div className="h-5 bg-gray-200 rounded w-16"></div>
                      <div className="h-5 bg-gray-200 rounded w-8"></div>
                    </div>
                    <div className="h-8 bg-gray-200 rounded w-full"></div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : filtered.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((a) => (
                <Card
                  key={a.id}
                  className="transition-all duration-200 hover:shadow-lg hover:border-primary/40 group flex flex-col h-full cursor-pointer"
                  onClick={() => handlePaperClick(a)}
                >
                  <CardHeader className="space-y-3 pb-4">
                    <div className="space-y-2">
                      <div className="flex items-start justify-end">
                        <Badge variant="outline" className={cn("border text-center shrink-0 whitespace-nowrap text-xs", typeBadgeColor(a.type))}>
                          {a.type === "Randomized Controlled Trial"
                            ? "RCT"
                            : a.type === "Clinical Practice Guideline"
                              ? "CPG"
                              : a.type}
                        </Badge>
                      </div>
                      <CardTitle className="text-base leading-tight group-hover:text-primary transition-colors line-clamp-3 -mt-1">
                        {a.title}
                      </CardTitle>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {a.authors.slice(0, 2).join(", ")}
                      {a.authors.length > 2 ? ", et al." : ""} • {a.journal} • {new Date(a.date).getFullYear()}
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="text-sm text-muted-foreground line-clamp-4">{a.abstract}</p>
                  </CardContent>
                  <CardFooter className="flex flex-col gap-3 !pt-4">
                    <div className="flex items-center gap-2 w-full">
                      <Badge variant="secondary">{a.source}</Badge>
                      {a.doi && (
                        <Badge variant="outline" className="text-xs">
                          DOI
                        </Badge>
                      )}
                      {a.url && (
                        <Badge variant="outline" className="text-xs">
                          Link
                        </Badge>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant={savedIds.has(a.id) ? "secondary" : "outline"}
                      onClick={(e) => {
                        e.stopPropagation()
                        saveToLibrary(a)
                      }}
                      className={cn(
                        "w-full transition-all text-xs",
                        savedIds.has(a.id)
                          ? "border-green-200 text-green-700 bg-green-50 dark:bg-green-900/20 dark:text-green-200"
                          : "hover:border-primary/40 hover:text-primary",
                      )}
                    >
                      {savedIds.has(a.id) ? (
                        <>
                          <Check className="h-3.5 w-3.5 mr-1.5" />
                          Saved
                        </>
                      ) : (
                        <>
                          <BookPlus className="h-3.5 w-3.5 mr-1.5" />
                          Save to Library
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                No results match your filters. Try adjusting the search or filter criteria.
              </CardContent>
            </Card>
          )}
        </div>
        </section>
      </div>
    </AppShell>
  )
}
