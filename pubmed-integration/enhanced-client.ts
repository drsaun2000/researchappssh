import { LRUCache } from 'lru-cache'
import { assessArticleQuality, validateSearchParams, type QualityMetrics } from './validation'

const EUTILS = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"
const API_KEY = "419b3a76720e054a6926594c58b4cd38c908"
const TOOL_NAME = "paperinsight"
const EMAIL = "research@paperinsight.com"

// Rate limiting: 3 requests per second with API key (being conservative)
class RateLimiter {
  private queue: Array<() => void> = []
  private processing = false
  private readonly interval = 350 // ~3 requests per second

  async throttle<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn()
          resolve(result)
        } catch (error) {
          reject(error)
        }
      })
      this.process()
    })
  }

  private async process() {
    if (this.processing || this.queue.length === 0) return
    
    this.processing = true
    const fn = this.queue.shift()!
    await fn()
    
    setTimeout(() => {
      this.processing = false
      this.process()
    }, this.interval)
  }
}

const rateLimiter = new RateLimiter()

// Cache for API responses (5 minutes TTL)
const cache = new LRUCache<string, any>({
  max: 500,
  ttl: 5 * 60 * 1000, // 5 minutes
})

export type SortType = 'latest' | 'most_cited' | 'relevance'
export type StudyType = 'all' | 'rct' | 'clinical_trial' | 'review' | 'meta_analysis'

export interface EnhancedPubMedParams {
  q: string
  max?: number
  offset?: number
  sort?: SortType
  studyType?: StudyType
  dateRange?: {
    from: number
    to?: number
  }
  minCitations?: number
  hasAbstract?: boolean
}

export interface PubMedArticle {
  id: string
  pmid: string
  title: string
  authors: string[]
  journal: string
  publicationDate: string
  abstract: string
  citationCount?: number
  doi?: string
  publicationTypes: string[]
  meshTerms?: string[]
  keywords?: string[]
  url: string
  quality?: QualityMetrics
}

export interface SearchResult {
  articles: PubMedArticle[]
  totalCount: number
  query: string
  searchTime: number
}

// Physical therapy focused MeSH terms and queries
const PT_MESH_TERMS = [
  '"Physical Therapy Modalities"[MeSH]',
  '"Physical Therapy Specialty"[MeSH]',
  '"Exercise Therapy"[MeSH]',
  '"Rehabilitation"[MeSH]',
  '"Manual Therapy"[MeSH]',
  '"Physiotherapy"[All Fields]',
  '"Physical Rehabilitation"[All Fields]'
]

const STUDY_TYPE_FILTERS = {
  rct: '"Randomized Controlled Trial"[Publication Type]',
  clinical_trial: '"Clinical Trial"[Publication Type]',
  review: '"Review"[Publication Type]',
  meta_analysis: '"Meta-Analysis"[Publication Type]',
  all: ''
}

function buildSearchTerm(params: EnhancedPubMedParams): string {
  let term = params.q

  // Add physical therapy context if not already specific
  if (!term.includes('MeSH') && !term.includes('[')) {
    term = `(${term}) AND (${PT_MESH_TERMS.slice(0, 3).join(' OR ')})`
  }

  // Add study type filter
  if (params.studyType && params.studyType !== 'all') {
    const filter = STUDY_TYPE_FILTERS[params.studyType]
    if (filter) {
      term += ` AND ${filter}`
    }
  }

  // Add date range
  if (params.dateRange) {
    const fromYear = params.dateRange.from
    const toYear = params.dateRange.to || new Date().getFullYear()
    term += ` AND ("${fromYear}"[DP] : "${toYear}"[DP])`
  }

  // Require abstract if specified
  if (params.hasAbstract) {
    term += ' AND hasabstract[text]'
  }

  return term
}

async function makeRequest(url: string, cacheKey?: string): Promise<any> {
  if (cacheKey && cache.has(cacheKey)) {
    return cache.get(cacheKey)
  }

  const response = await rateLimiter.throttle(async () => {
    const res = await fetch(url)
    if (!res.ok) {
      throw new Error(`API request failed: ${res.status} ${res.statusText}`)
    }
    return res
  })

  let data
  const contentType = response.headers.get('content-type') || ''
  
  if (contentType.includes('application/json')) {
    data = await response.json()
  } else {
    data = await response.text()
  }

  if (cacheKey) {
    cache.set(cacheKey, data)
  }

  return data
}

async function searchPubMedIds(params: EnhancedPubMedParams): Promise<{ ids: string[], totalCount: number }> {
  const term = buildSearchTerm(params)
  const sort = params.sort === 'latest' ? 'pub_date' : 'relevance'
  
  const searchParams = new URLSearchParams({
    db: 'pubmed',
    term: term,
    retmode: 'json',
    retmax: String(params.max || 20),
    retstart: String(params.offset || 0),
    sort,
    tool: TOOL_NAME,
    email: EMAIL,
    api_key: API_KEY
  })

  const url = `${EUTILS}/esearch.fcgi?${searchParams}`
  const cacheKey = `search:${Buffer.from(url).toString('base64').slice(0, 50)}`
  
  const data = await makeRequest(url, cacheKey)
  
  return {
    ids: data?.esearchresult?.idlist || [],
    totalCount: parseInt(data?.esearchresult?.count || '0')
  }
}

async function getSummaries(ids: string[]): Promise<Record<string, any>> {
  if (!ids.length) return {}
  
  const searchParams = new URLSearchParams({
    db: 'pubmed',
    id: ids.join(','),
    retmode: 'json',
    tool: TOOL_NAME,
    email: EMAIL,
    api_key: API_KEY
  })

  const url = `${EUTILS}/esummary.fcgi?${searchParams}`
  const cacheKey = `summary:${ids.join(',').slice(0, 50)}`
  
  const data = await makeRequest(url, cacheKey)
  return data?.result || {}
}

async function getFullRecords(ids: string[]): Promise<string> {
  if (!ids.length) return ''
  
  const searchParams = new URLSearchParams({
    db: 'pubmed',
    id: ids.join(','),
    retmode: 'xml',
    tool: TOOL_NAME,
    email: EMAIL,
    api_key: API_KEY
  })

  const url = `${EUTILS}/efetch.fcgi?${searchParams}`
  const cacheKey = `fetch:${ids.join(',').slice(0, 50)}`
  
  return await makeRequest(url, cacheKey)
}

async function getCitationCounts(ids: string[]): Promise<Record<string, number>> {
  if (!ids.length) return {}
  
  const citationCounts: Record<string, number> = {}
  
  // Process in batches to avoid overwhelming the API
  const batchSize = 10
  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize)
    
    const searchParams = new URLSearchParams({
      db: 'pubmed',
      id: batch.join(','),
      cmd: 'citedin',
      retmode: 'json',
      tool: TOOL_NAME,
      email: EMAIL,
      api_key: API_KEY
    })

    const url = `${EUTILS}/elink.fcgi?${searchParams}`
    const cacheKey = `citations:${batch.join(',')}`
    
    try {
      const data = await makeRequest(url, cacheKey)
      
      // Parse citation data from ELink response
      if (data?.linksets) {
        for (const linkset of data.linksets) {
          const pmid = linkset.ids?.[0]
          const citingIds = linkset.linksetdbs?.[0]?.links || []
          if (pmid) {
            citationCounts[pmid] = citingIds.length
          }
        }
      }
    } catch (error) {
      console.warn(`Failed to get citations for batch: ${batch.join(',')}`, error)
      // Set default citation count of 0 for failed requests
      batch.forEach(id => {
        citationCounts[id] = 0
      })
    }
  }
  
  return citationCounts
}

function parseFullRecords(xml: string, ids: string[]): Record<string, Partial<PubMedArticle>> {
  const records: Record<string, Partial<PubMedArticle>> = {}
  
  try {
    ids.forEach(id => {
      // Enhanced regex patterns for better XML parsing
      const pmidPattern = new RegExp(`<PMID[^>]*>${id}</PMID>[\\s\\S]*?(?=<PMID|$)`, 'i')
      const articleMatch = xml.match(pmidPattern)
      
      if (articleMatch) {
        const articleXml = articleMatch[0]
        
        // Extract abstract
        const abstractPattern = /<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/gi
        const abstracts: string[] = []
        let abstractMatch
        while ((abstractMatch = abstractPattern.exec(articleXml)) !== null) {
          abstracts.push(abstractMatch[1].replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim())
        }
        
        // Extract MeSH terms
        const meshPattern = /<DescriptorName[^>]*>(.*?)<\/DescriptorName>/gi
        const meshTerms: string[] = []
        let meshMatch
        while ((meshMatch = meshPattern.exec(articleXml)) !== null) {
          meshTerms.push(meshMatch[1].trim())
        }
        
        // Extract DOI
        const doiPattern = /<ArticleId IdType="doi">(.*?)<\/ArticleId>/i
        const doiMatch = articleXml.match(doiPattern)
        
        // Extract publication types
        const pubTypePattern = /<PublicationType[^>]*>(.*?)<\/PublicationType>/gi
        const publicationTypes: string[] = []
        let pubTypeMatch
        while ((pubTypeMatch = pubTypePattern.exec(articleXml)) !== null) {
          publicationTypes.push(pubTypeMatch[1].trim())
        }
        
        records[id] = {
          abstract: abstracts.join(' ') || undefined,
          doi: doiMatch?.[1] || undefined,
          meshTerms: meshTerms.length > 0 ? meshTerms : undefined,
          publicationTypes
        }
      }
    })
  } catch (error) {
    console.error('Error parsing full records:', error)
  }
  
  return records
}

export async function enhancedSearchPubMed(params: EnhancedPubMedParams): Promise<SearchResult> {
  const startTime = Date.now()
  
  // Validate search parameters
  const validation = validateSearchParams({
    q: params.q,
    max: params.max,
    fromYear: params.dateRange?.from,
    toYear: params.dateRange?.to
  })
  
  if (!validation.valid) {
    throw new Error(`Invalid search parameters: ${validation.errors.join(', ')}`)
  }
  
  try {
    // Step 1: Search for PMIDs
    const { ids, totalCount } = await searchPubMedIds(params)
    
    if (!ids.length) {
      return {
        articles: [],
        totalCount: 0,
        query: params.q,
        searchTime: Date.now() - startTime
      }
    }
    
    // Step 2: Get summaries and full records in parallel
    const [summaries, fullXml] = await Promise.all([
      getSummaries(ids),
      getFullRecords(ids)
    ])
    
    const fullRecords = parseFullRecords(fullXml, ids)
    
    // Step 3: Get citation counts if sorting by most cited
    let citationCounts: Record<string, number> = {}
    if (params.sort === 'most_cited') {
      citationCounts = await getCitationCounts(ids)
    }
    
    // Step 4: Combine data and create articles
    let articles: PubMedArticle[] = ids.map(id => {
      const summary = summaries[id] || {}
      const fullRecord = fullRecords[id] || {}
      
      const article = {
        id,
        pmid: id,
        title: summary.title || 'Untitled',
        authors: (summary.authors || []).map((a: any) => a.name).filter(Boolean),
        journal: summary.fulljournalname || summary.source || 'Unknown Journal',
        publicationDate: summary.pubdate || 'Unknown',
        abstract: fullRecord.abstract || 'Abstract not available',
        citationCount: citationCounts[id] || 0,
        doi: fullRecord.doi,
        publicationTypes: fullRecord.publicationTypes || [],
        meshTerms: fullRecord.meshTerms,
        url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`
      }
      
      // Add quality assessment
      article.quality = assessArticleQuality(article)
      
      return article
    })
    
    // Step 5: Apply additional filters
    if (params.minCitations && params.minCitations > 0) {
      articles = articles.filter(a => (a.citationCount || 0) >= params.minCitations!)
    }
    
    // Step 6: Sort results
    if (params.sort === 'most_cited') {
      articles.sort((a, b) => (b.citationCount || 0) - (a.citationCount || 0))
    } else if (params.sort === 'latest') {
      articles.sort((a, b) => new Date(b.publicationDate).getTime() - new Date(a.publicationDate).getTime())
    }
    
    return {
      articles,
      totalCount,
      query: params.q,
      searchTime: Date.now() - startTime
    }
    
  } catch (error) {
    console.error('Enhanced PubMed search failed:', error)
    throw new Error(`PubMed search failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Utility function to get trending topics (most cited papers in recent time)
export async function getTrendingTopics(days: number = 30): Promise<PubMedArticle[]> {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  
  return (await enhancedSearchPubMed({
    q: 'physical therapy OR physiotherapy',
    max: 20,
    sort: 'most_cited',
    dateRange: {
      from: startDate.getFullYear(),
      to: endDate.getFullYear()
    },
    hasAbstract: true,
    minCitations: 1
  })).articles
}

// Utility function for domain-specific searches
export const PT_DOMAINS = {
  musculoskeletal: 'musculoskeletal OR orthopedic OR "low back pain" OR knee OR shoulder',
  neurological: 'neurological OR stroke OR "spinal cord injury" OR "traumatic brain injury"',
  cardiopulmonary: 'cardiopulmonary OR cardiac OR respiratory OR "heart failure"',
  pediatric: 'pediatric OR paediatric OR children OR infant',
  geriatric: 'geriatric OR elderly OR "older adult" OR aging',
  sports: 'sports OR athletic OR "sports medicine" OR injury prevention'
} as const

export type PTDomain = keyof typeof PT_DOMAINS

export async function searchByDomain(domain: PTDomain, params: Omit<EnhancedPubMedParams, 'q'>): Promise<SearchResult> {
  const domainQuery = PT_DOMAINS[domain]
  const combinedQuery = `(${domainQuery}) AND (physical therapy OR physiotherapy)`
  
  return enhancedSearchPubMed({
    ...params,
    q: combinedQuery
  })
}
