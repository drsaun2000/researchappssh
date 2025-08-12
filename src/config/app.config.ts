export const APP_CONFIG = {
  name: "PhysioHub Research Platform",
  version: "1.0.0",
  description: "Advanced physical therapy research platform with multi-source literature aggregation",

  // API Configuration
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || "/api",
    timeout: 30000,
    retryAttempts: 3,
  },

  // AI Service Configuration
  ai: {
    defaultModel: "claude-3-sonnet",
    fallbackModel: "gpt-4",
    maxTokens: 4000,
    temperature: 0.1,
  },

  // PubMed Configuration
  pubmed: {
    baseUrl: "https://eutils.ncbi.nlm.nih.gov/entrez/eutils",
    rateLimit: 3, // requests per second
    maxResults: 100,
    cacheTtl: 3600000, // 1 hour in milliseconds
  },

  // File Processing Configuration
  fileProcessing: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ["application/pdf"],
    chunkSize: 2000,
    chunkOverlap: 200,
  },

  // Database Configuration
  database: {
    connectionTimeout: 10000,
    queryTimeout: 30000,
    maxConnections: 10,
  },

  // Feature Flags
  features: {
    enableAnalytics: process.env.NODE_ENV === "production",
    enableCaching: true,
    enableRateLimit: true,
    enableCompression: true,
  },
} as const

export type AppConfig = typeof APP_CONFIG
