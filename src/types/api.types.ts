/**
 * Common API response types and interfaces
 */

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  timestamp: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export interface ErrorResponse {
  success: false
  error: string
  code: string
  details?: Record<string, any>
  timestamp: string
}

/**
 * Analysis related types
 */
export interface AnalysisRequest {
  content: string
  type: "pdf" | "text"
  options?: {
    includeQuality?: boolean
    includeCitations?: boolean
    language?: string
  }
}

export interface AnalysisResult {
  id: string
  summary: string
  methodology: string
  findings: string
  limitations: string
  conclusion: string
  clinicalRelevance: string
  qualityScore: number
  applicabilityScore: number
  evidenceLevel: string
  riskOfBias: Record<string, string>
  keyStats: string
  confidence: number
  processingTime: number
  model: string
}

/**
 * File processing types
 */
export interface FileUpload {
  file: File
  metadata?: Record<string, any>
}

export interface ProcessedFile {
  id: string
  filename: string
  size: number
  type: string
  content: string
  sections: DocumentSection[]
  metadata: FileMetadata
  processingTime: number
}

export interface DocumentSection {
  type: "title" | "abstract" | "introduction" | "methods" | "results" | "discussion" | "conclusion" | "references"
  content: string
  startIndex: number
  endIndex: number
  confidence: number
}

export interface FileMetadata {
  title?: string
  authors?: string[]
  journal?: string
  publicationDate?: string
  doi?: string
  pages?: number
  language?: string
}

/**
 * Search and filtering types
 */
export interface SearchFilters {
  dateRange?: {
    from: Date
    to: Date
  }
  studyTypes?: string[]
  journals?: string[]
  authors?: string[]
  minQualityScore?: number
  evidenceLevels?: string[]
}

export interface SortOptions {
  field: "relevance" | "date" | "quality" | "citations"
  direction: "asc" | "desc"
}
