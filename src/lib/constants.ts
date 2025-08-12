export const ROUTES = {
  HOME: "/",
  UPLOAD: "/upload",
  LIBRARY: "/library",
  PUBMED: "/pubmed",
  EXPLORE: "/explore",
  API: {
    ANALYZE: "/api/analyze",
    PUBMED_SEARCH: "/api/pubmed/search",
    PUBMED_ENHANCED: "/api/pubmed/enhanced-search",
    AI_STATUS: "/api/ai/status",
    RESEARCH_ARTICLES: "/api/research/articles",
  },
} as const

export const ERROR_MESSAGES = {
  GENERIC: "An unexpected error occurred. Please try again.",
  NETWORK: "Network error. Please check your connection.",
  FILE_TOO_LARGE: "File size exceeds the maximum limit.",
  INVALID_FILE_TYPE: "Invalid file type. Please upload a PDF file.",
  AI_SERVICE_UNAVAILABLE: "AI service is currently unavailable.",
  PUBMED_SERVICE_ERROR: "PubMed service error. Please try again later.",
} as const

export const SUCCESS_MESSAGES = {
  FILE_UPLOADED: "File uploaded successfully.",
  ANALYSIS_COMPLETE: "Analysis completed successfully.",
  SEARCH_COMPLETE: "Search completed successfully.",
} as const

export const VALIDATION_RULES = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: ["application/pdf"],
  MAX_SEARCH_QUERY_LENGTH: 500,
  MIN_SEARCH_QUERY_LENGTH: 3,
} as const
