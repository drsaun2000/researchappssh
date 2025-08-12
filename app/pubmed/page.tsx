"use client"

import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { AppShell } from "@/components/app-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useLibrary } from "@/lib/store"
import { Search, TrendingUp, Filter, Calendar, Award, BookOpen, ChevronLeft, ChevronRight } from "lucide-react"

type PubItem = {
  id: string
  pmid?: string
  title: string
  authors: string[]
  journal?: string
  publicationDate?: string
  abstract?: string
  citationCount?: number
  doi?: string
  publicationTypes?: string[]
  meshTerms?: string[]
  url?: string
}

type SearchFilters = {
  sort: 'latest' | 'most_cited' | 'relevance'
  studyType: 'all' | 'rct' | 'clinical_trial' | 'review' | 'meta_analysis'
  hasAbstract: boolean
  fromYear?: number
  toYear?: number
  minCitations?: number
}

type PTDomain = 'musculoskeletal' | 'neurological' | 'cardiopulmonary' | 'pediatric' | 'geriatric' | 'sports'

const DOMAIN_LABELS = {
  musculoskeletal: 'Musculoskeletal',
  neurological: 'Neurological',
  cardiopulmonary: 'Cardiopulmonary',
  pediatric: 'Pediatric',
  geriatric: 'Geriatric',
  sports: 'Sports Medicine'
} as const

export default function EnhancedPubMedPage() {
  const [q, setQ] = useState("physical therapy randomized")
  const [items, setItems] = useState<PubItem[]>([])
  const [loading, setLoading] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const [searchTime, setSearchTime] = useState(0)
  const [activeTab, setActiveTab] = useState('search')
  const [selectedDomain, setSelectedDomain] = useState<PTDomain>('musculoskeletal')
  const [trendingArticles, setTrendingArticles] = useState<PubItem[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [resultsPerPage] = useState(20)
  const [filters, setFilters] = useState<SearchFilters>({
    sort: 'relevance',
    studyType: 'all',
    hasAbstract: true,
    fromYear: new Date().getFullYear() - 5,
    toYear: new Date().getFullYear()
  })
  const { addPaper } = useLibrary()

  const search = async (page: number = 1) => {
    setLoading(true)
    setCurrentPage(page)
    
    // Scroll to top when changing pages
    if (page > 1) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
    
    try {
      const offset = (page - 1) * resultsPerPage
      const params = new URLSearchParams({
        q: q,
        max: resultsPerPage.toString(),
        offset: offset.toString(),
        sort: filters.sort,
        studyType: filters.studyType,
        hasAbstract: filters.hasAbstract.toString(),
        ...(filters.fromYear && { fromYear: filters.fromYear.toString() }),
        ...(filters.toYear && { toYear: filters.toYear.toString() }),
        ...(filters.minCitations && { minCitations: filters.minCitations.toString() })
      })
      
      const res = await fetch(`/api/pubmed/enhanced-search?${params}`)
      const json = await res.json()
      
      if (json.success) {
        setItems(json.articles || [])
        setTotalCount(json.totalCount || 0)
        setSearchTime(json.searchTime || 0)
      } else {
        console.error('Search failed:', json.error)
        setItems([])
      }
    } catch (error) {
      console.error('Search error:', error)
      setItems([])
    }
    setLoading(false)
  }

  const searchByDomain = async (domain: PTDomain) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        domain,
        max: '15',
        sort: 'latest',
        studyType: 'all',
        hasAbstract: 'true'
      })
      
      const res = await fetch(`/api/pubmed/domains?${params}`)
      const json = await res.json()
      
      if (json.success) {
        setItems(json.articles || [])
        setTotalCount(json.totalCount || 0)
        setSearchTime(json.searchTime || 0)
      }
    } catch (error) {
      console.error('Domain search error:', error)
    }
    setLoading(false)
  }

  const loadTrending = async () => {
    try {
      const res = await fetch('/api/pubmed/trending?days=30')
      const json = await res.json()
      if (json.success) {
        setTrendingArticles(json.articles || [])
      }
    } catch (error) {
      console.error('Trending error:', error)
    }
  }

  const toPubMed = (it: PubItem) => it.url || `https://pubmed.ncbi.nlm.nih.gov/${it.pmid || it.id}/`

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
    search(1)
    loadTrending()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (activeTab === 'domains') {
      searchByDomain(selectedDomain)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, selectedDomain])

  const formatCitationCount = (count?: number) => {
    if (!count || count === 0) return null
    return count > 1000 ? `${(count / 1000).toFixed(1)}k` : count.toString()
  }

  const getStudyTypeBadge = (types: string[] = []) => {
    const important = types.find(t => 
      t.includes('Randomized') || 
      t.includes('Clinical Trial') || 
      t.includes('Review') ||
      t.includes('Meta-Analysis')
    )
    return important ? important.replace(' Trial', '') : null
  }

  return (
    <AppShell>
      <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Enhanced PubMed Research Explorer
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Search and discover high-quality physical therapy research with advanced filtering and citation analysis.
          </p>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="search" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Custom Search
          </TabsTrigger>
          <TabsTrigger value="domains" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            By Domain
          </TabsTrigger>
          <TabsTrigger value="trending" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Trending
          </TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <Input 
                    value={q} 
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Enter your research query..."
                    className="w-full"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        setCurrentPage(1)
                        search(1)
                      }
                    }}
                  />
                </div>
                <Button onClick={() => {
                  setCurrentPage(1)
                  search(1)
                }} disabled={loading} className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  {loading ? "Searching..." : "Search"}
                </Button>
              </div>
              
              {/* Advanced Filters */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label>Sort by</Label>
                  <Select value={filters.sort} onValueChange={(value: any) => setFilters(f => ({...f, sort: value}))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="relevance">Relevance</SelectItem>
                      <SelectItem value="latest">Latest</SelectItem>
                      <SelectItem value="most_cited">Most Cited</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Study Type</Label>
                  <Select value={filters.studyType} onValueChange={(value: any) => setFilters(f => ({...f, studyType: value}))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="rct">RCT</SelectItem>
                      <SelectItem value="clinical_trial">Clinical Trial</SelectItem>
                      <SelectItem value="review">Review</SelectItem>
                      <SelectItem value="meta_analysis">Meta-Analysis</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Year Range</Label>
                  <div className="flex gap-2">
                    <Input 
                      type="number" 
                      placeholder="From"
                      value={filters.fromYear || ''}
                      onChange={(e) => setFilters(f => ({...f, fromYear: e.target.value ? Number(e.target.value) : undefined}))}
                      className="w-20"
                    />
                    <Input 
                      type="number" 
                      placeholder="To"
                      value={filters.toYear || ''}
                      onChange={(e) => setFilters(f => ({...f, toYear: e.target.value ? Number(e.target.value) : undefined}))}
                      className="w-20"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Switch 
                      checked={filters.hasAbstract}
                      onCheckedChange={(checked) => setFilters(f => ({...f, hasAbstract: checked}))}
                    />
                    Require Abstract
                  </Label>
                </div>
              </div>
            </CardHeader>
          </Card>
        </TabsContent>

        <TabsContent value="domains" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Browse by Physical Therapy Domain</CardTitle>
              <div className="flex flex-wrap gap-2">
                {Object.entries(DOMAIN_LABELS).map(([key, label]) => (
                  <Button
                    key={key}
                    variant={selectedDomain === key ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedDomain(key as PTDomain)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </CardHeader>
          </Card>
        </TabsContent>

        <TabsContent value="trending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Trending in Physical Therapy (Last 30 Days)
              </CardTitle>
            </CardHeader>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Results Summary */}
      {(totalCount > 0 || searchTime > 0) && (
        <Card>
          <CardContent className="py-3">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Found {totalCount.toLocaleString()} results • Showing {((currentPage - 1) * resultsPerPage) + 1}-{Math.min(currentPage * resultsPerPage, totalCount)} of {totalCount}
              </span>
              <span>
                Search completed in {searchTime}ms
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Grid */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {(activeTab === 'trending' ? trendingArticles : items).map((it) => (
          <Card
            key={it.id}
            className="transition-all duration-200 hover:shadow-lg hover:scale-[1.02] hover:border-primary/50 dark:hover:border-primary/80 cursor-pointer group relative"
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
            <CardHeader className="space-y-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-base group-hover:text-primary transition-colors duration-200 leading-tight">
                  {it.title}
                </CardTitle>
                {it.citationCount && it.citationCount > 0 && (
                  <Badge variant="secondary" className="flex items-center gap-1 ml-2 shrink-0">
                    <Award className="h-3 w-3" />
                    {formatCitationCount(it.citationCount)}
                  </Badge>
                )}
              </div>
              
              {/* Badges for study types */}
              <div className="flex flex-wrap gap-1">
                {getStudyTypeBadge(it.publicationTypes) && (
                  <Badge variant="outline" className="text-xs">
                    {getStudyTypeBadge(it.publicationTypes)}
                  </Badge>
                )}
                {it.doi && (
                  <Badge variant="outline" className="text-xs">
                    DOI
                  </Badge>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              <div className="text-xs text-muted-foreground group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors duration-200">
                <div className="font-medium">
                  {(it.authors || []).slice(0, 3).join(", ")} {it.authors?.length! > 3 ? ", et al." : ""}
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <span className="truncate">{it.journal ?? "Journal"}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {it.publicationDate ?? "n.d."}
                  </span>
                </div>
              </div>
              
              <p className="text-sm line-clamp-4 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors duration-200">
                {it.abstract || "No abstract available."}
              </p>
              
              {/* MeSH Terms */}
              {it.meshTerms && it.meshTerms.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {it.meshTerms.slice(0, 3).map((term, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {term}
                    </Badge>
                  ))}
                  {it.meshTerms.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{it.meshTerms.length - 3}
                    </Badge>
                  )}
                </div>
              )}
              
              <div className="flex justify-between items-center pt-2">
                <div className="text-xs text-muted-foreground">
                  PMID: {it.pmid || it.id}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    importToLibrary(it)
                  }}
                  className="group-hover:bg-primary/10 group-hover:border-primary/30 group-hover:text-primary dark:group-hover:bg-primary/20 dark:group-hover:border-primary/50 dark:group-hover:text-primary-foreground transition-all duration-200"
                >
                  Add to Library
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {totalCount > resultsPerPage && !loading && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {Math.ceil(totalCount / resultsPerPage)}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => search(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                
                {/* Page numbers with scrollable container */}
                <div className="flex items-center gap-1 max-w-xs overflow-x-auto px-2">
                  {(() => {
                    const totalPages = Math.ceil(totalCount / resultsPerPage)
                    const maxVisible = 7
                    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2))
                    let endPage = Math.min(totalPages, startPage + maxVisible - 1)
                    
                    if (endPage - startPage + 1 < maxVisible) {
                      startPage = Math.max(1, endPage - maxVisible + 1)
                    }
                    
                    const pages = []
                    
                    // First page + ellipsis
                    if (startPage > 2) {
                      pages.push(1)
                      if (startPage > 3) pages.push('...')
                    }
                    
                    // Visible page range
                    for (let i = startPage; i <= endPage; i++) {
                      pages.push(i)
                    }
                    
                    // Ellipsis + last page
                    if (endPage < totalPages - 1) {
                      if (endPage < totalPages - 2) pages.push('...')
                      pages.push(totalPages)
                    }
                    
                    return pages.map((page, idx) => 
                      page === '...' ? (
                        <span key={`ellipsis-${idx}`} className="px-2 text-muted-foreground">...</span>
                      ) : (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          className="w-10 h-8"
                          onClick={() => search(page as number)}
                        >
                          {page}
                        </Button>
                      )
                    )
                  })()}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => search(currentPage + 1)}
                  disabled={currentPage >= Math.ceil(totalCount / resultsPerPage)}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="py-20 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Searching PubMed database...</p>
          </CardContent>
        </Card>
      )}
      
      {/* Empty State */}
      {!loading && (activeTab === 'trending' ? trendingArticles : items).length === 0 && (
        <Card>
          <CardContent className="py-20 text-center text-muted-foreground space-y-4">
            <Search className="h-12 w-12 mx-auto opacity-50" />
            <div>
              <h3 className="font-medium text-lg mb-2">No results found</h3>
              <p>Try adjusting your search terms or filters to find relevant research papers.</p>
            </div>
          </CardContent>
        </Card>
        )}
      </div>
    </AppShell>
  )
}
