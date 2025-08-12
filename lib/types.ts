export type EvidenceLevel =
  | "Systematic Review"
  | "Meta-analysis"
  | "Randomized Controlled Trial"
  | "Cohort"
  | "Case-Control"
  | "Case Series"
  | "Case Report"
  | "Guideline"
  | "Other"

export type RiskOfBias = {
  selection: "Low" | "Some concerns" | "High"
  performance: "Low" | "Some concerns" | "High"
  detection: "Low" | "Some concerns" | "High"
  attrition: "Low" | "Some concerns" | "High"
  reporting: "Low" | "Some concerns" | "High"
}

export type PaperMeta = {
  id: string
  title: string
  authors: string[]
  abstract: string
  journal?: string
  publicationDate?: string
  doi?: string
  source?: "upload" | "pubmed"
  subspecialties?: string[]
  filename?: string
  pages?: number
  // New optional metadata for viewing original source
  sourceUrl?: string
  // Optional tags for display (e.g., "RCT", "Systematic Review")
  tags?: string[]
}

export type Analysis = {
  paperId: string
  findings: string
  limitations: string
  createdAt: string
  model?: string
  // Extended fields for richer UI
  keyFindings?: string[]
  methodology?: string
  clinicalRelevance?: string
  evidenceLevel?: string
  // Historical "confidence" was 0..1 in some mocks; keep both
  confidence?: number // 0..1
  confidenceScore?: number // 0..100
  riskOfBias?: Partial<RiskOfBias>
  keyStats?: string
}

export type Paper = PaperMeta & {
  text?: string
  analysis?: Analysis
  bookmarked?: boolean
}

export type PubMedItem = {
  id: string
  title: string
  authors: string[]
  journal?: string
  publicationDate?: string
  abstract?: string
  pmid?: string
  doi?: string
  subspecialties?: string[]
}
