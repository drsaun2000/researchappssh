// Quality validation and scoring for PubMed articles

export interface QualityMetrics {
  score: number // 0-100
  factors: {
    hasAbstract: boolean
    hasAuthors: boolean
    hasJournal: boolean
    hasRecentPublication: boolean
    hasHighCitations: boolean
    isHighQualityStudy: boolean
    hasDoiOrPmid: boolean
  }
  recommendations: string[]
}

export interface StudyTypeInfo {
  type: string
  evidenceLevel: number // 1-7 (1 = highest)
  description: string
}

// Evidence hierarchy based on common medical research standards
const STUDY_TYPE_HIERARCHY: Record<string, StudyTypeInfo> = {
  'Systematic Review': { type: 'Systematic Review', evidenceLevel: 1, description: 'Comprehensive review of all available evidence' },
  'Meta-Analysis': { type: 'Meta-Analysis', evidenceLevel: 1, description: 'Statistical synthesis of multiple studies' },
  'Randomized Controlled Trial': { type: 'RCT', evidenceLevel: 2, description: 'Gold standard for intervention studies' },
  'Clinical Trial': { type: 'Clinical Trial', evidenceLevel: 3, description: 'Controlled study in humans' },
  'Cohort Study': { type: 'Cohort Study', evidenceLevel: 4, description: 'Observational study following groups over time' },
  'Case-Control Study': { type: 'Case-Control Study', evidenceLevel: 5, description: 'Compares cases with controls retrospectively' },
  'Cross-Sectional Study': { type: 'Cross-Sectional Study', evidenceLevel: 6, description: 'Snapshot at a single point in time' },
  'Case Study': { type: 'Case Study', evidenceLevel: 7, description: 'Detailed report of individual cases' }
}

// High-impact journals in physical therapy and rehabilitation
const HIGH_IMPACT_JOURNALS = new Set([
  'Physical Therapy',
  'Journal of Physical Therapy Science',
  'Physiotherapy',
  'Archives of Physical Medicine and Rehabilitation',
  'Clinical Rehabilitation',
  'Disability and Rehabilitation',
  'Journal of Rehabilitation Medicine',
  'American Journal of Physical Medicine & Rehabilitation',
  'Physical Therapy in Sport',
  'Journal of Orthopaedic & Sports Physical Therapy',
  'Manual Therapy',
  'Musculoskeletal Science and Practice'
])

export function assessArticleQuality(article: {
  title: string
  authors: string[]
  journal?: string
  publicationDate?: string
  abstract?: string
  citationCount?: number
  doi?: string
  pmid?: string
  publicationTypes?: string[]
  meshTerms?: string[]
}): QualityMetrics {
  const factors = {
    hasAbstract: Boolean(article.abstract && article.abstract.length > 50),
    hasAuthors: Boolean(article.authors && article.authors.length > 0),
    hasJournal: Boolean(article.journal),
    hasRecentPublication: isRecentPublication(article.publicationDate),
    hasHighCitations: (article.citationCount || 0) > 5,
    isHighQualityStudy: isHighQualityStudyType(article.publicationTypes || []),
    hasDoiOrPmid: Boolean(article.doi || article.pmid)
  }

  let score = 0
  const recommendations: string[] = []

  // Base scoring
  if (factors.hasAbstract) {
    score += 20
  } else {
    recommendations.push("Article lacks a comprehensive abstract")
  }

  if (factors.hasAuthors) {
    score += 15
  } else {
    recommendations.push("Author information is missing")
  }

  if (factors.hasJournal) {
    score += 10
    // Bonus for high-impact journals
    if (HIGH_IMPACT_JOURNALS.has(article.journal!)) {
      score += 10
      recommendations.push(`Published in high-impact journal: ${article.journal}`)
    }
  } else {
    recommendations.push("Journal information is missing")
  }

  if (factors.hasRecentPublication) {
    score += 10
  } else {
    recommendations.push("Consider more recent publications for current evidence")
  }

  if (factors.hasHighCitations) {
    score += 15
    if ((article.citationCount || 0) > 20) {
      score += 5
      recommendations.push(`Highly cited work (${article.citationCount} citations)`)
    }
  }

  if (factors.isHighQualityStudy) {
    score += 20
    const studyType = getHighestEvidenceType(article.publicationTypes || [])
    if (studyType) {
      recommendations.push(`High-quality study design: ${studyType.type} (Evidence Level ${studyType.evidenceLevel})`)
    }
  } else {
    recommendations.push("Consider studies with stronger research designs (RCTs, systematic reviews)")
  }

  if (factors.hasDoiOrPmid) {
    score += 10
  }

  // Additional quality indicators
  if (article.meshTerms && article.meshTerms.length > 0) {
    score += 5
    if (hasPhysioTherapyMesh(article.meshTerms)) {
      score += 5
      recommendations.push("Contains relevant physical therapy MeSH terms")
    }
  }

  // Ensure score is within bounds
  score = Math.max(0, Math.min(100, score))

  // Add general recommendations based on score
  if (score < 40) {
    recommendations.unshift("⚠️ Low quality score - use with caution")
  } else if (score < 60) {
    recommendations.unshift("📚 Moderate quality - acceptable for general reference")
  } else if (score < 80) {
    recommendations.unshift("✅ Good quality - reliable source")
  } else {
    recommendations.unshift("🌟 Excellent quality - highly recommended")
  }

  return {
    score,
    factors,
    recommendations
  }
}

function isRecentPublication(pubDate?: string): boolean {
  if (!pubDate) return false
  
  try {
    const pubYear = parseInt(pubDate.split(/[\s\-\/]/)[0])
    const currentYear = new Date().getFullYear()
    return (currentYear - pubYear) <= 5 // Within 5 years
  } catch {
    return false
  }
}

function isHighQualityStudyType(publicationTypes: string[]): boolean {
  return publicationTypes.some(type => 
    type.includes('Randomized Controlled Trial') ||
    type.includes('Meta-Analysis') ||
    type.includes('Systematic Review') ||
    type.includes('Clinical Trial')
  )
}

function getHighestEvidenceType(publicationTypes: string[]): StudyTypeInfo | null {
  let highest: StudyTypeInfo | null = null
  
  for (const type of publicationTypes) {
    for (const [key, info] of Object.entries(STUDY_TYPE_HIERARCHY)) {
      if (type.includes(key)) {
        if (!highest || info.evidenceLevel < highest.evidenceLevel) {
          highest = info
        }
      }
    }
  }
  
  return highest
}

function hasPhysioTherapyMesh(meshTerms: string[]): boolean {
  const ptMeshTerms = [
    'Physical Therapy Modalities',
    'Physical Therapy Specialty',
    'Exercise Therapy',
    'Rehabilitation',
    'Manual Therapy',
    'Musculoskeletal Manipulations',
    'Range of Motion',
    'Strength Training'
  ]
  
  return meshTerms.some(term => 
    ptMeshTerms.some(ptTerm => term.toLowerCase().includes(ptTerm.toLowerCase()))
  )
}

// Validation for search parameters
export function validateSearchParams(params: {
  q?: string
  max?: number
  sort?: string
  studyType?: string
  fromYear?: number
  toYear?: number
}): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (!params.q || params.q.trim().length < 2) {
    errors.push("Search query must be at least 2 characters long")
  }
  
  if (params.max !== undefined && (params.max < 1 || params.max > 100)) {
    errors.push("Max results must be between 1 and 100")
  }
  
  if (params.fromYear !== undefined && (params.fromYear < 1900 || params.fromYear > new Date().getFullYear())) {
    errors.push("From year must be between 1900 and current year")
  }
  
  if (params.toYear !== undefined && (params.toYear < 1900 || params.toYear > new Date().getFullYear())) {
    errors.push("To year must be between 1900 and current year")
  }
  
  if (params.fromYear && params.toYear && params.fromYear > params.toYear) {
    errors.push("From year cannot be greater than to year")
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

// Rate limiting helper
export class RequestTracker {
  private requests: Map<string, number[]> = new Map()
  private readonly maxRequests: number
  private readonly windowMs: number
  
  constructor(maxRequests = 10, windowMs = 60000) { // 10 requests per minute default
    this.maxRequests = maxRequests
    this.windowMs = windowMs
  }
  
  canMakeRequest(identifier: string): boolean {
    const now = Date.now()
    const requests = this.requests.get(identifier) || []
    
    // Clean old requests outside the window
    const validRequests = requests.filter(time => now - time < this.windowMs)
    this.requests.set(identifier, validRequests)
    
    return validRequests.length < this.maxRequests
  }
  
  recordRequest(identifier: string): void {
    const now = Date.now()
    const requests = this.requests.get(identifier) || []
    requests.push(now)
    this.requests.set(identifier, requests)
  }
  
  getRemainingRequests(identifier: string): number {
    const now = Date.now()
    const requests = this.requests.get(identifier) || []
    const validRequests = requests.filter(time => now - time < this.windowMs)
    return Math.max(0, this.maxRequests - validRequests.length)
  }
  
  getResetTime(identifier: string): number {
    const now = Date.now()
    const requests = this.requests.get(identifier) || []
    if (requests.length === 0) return now
    
    const oldestRequest = Math.min(...requests)
    return oldestRequest + this.windowMs
  }
}
