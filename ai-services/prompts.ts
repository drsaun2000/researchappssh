import type { PaperMeta } from "@/lib/types"
import type { Sections } from "@/file-processing/sections"

export function buildAnalysisPrompt(meta: PaperMeta, sectionsOrText: Sections | string) {
  const isSections = typeof sectionsOrText !== "string"
  const s = isSections ? (sectionsOrText as Sections) : undefined
  const fullText = typeof sectionsOrText === "string" ? sectionsOrText : ""

  return `
You are a physical therapy research reviewer. Provide a concise, clinically useful analysis.

Return ONLY valid JSON with these keys:
- keyFindings (string[]): 3 concise bullet points on primary outcomes and effect sizes when present.
- methodology (string): brief summary of design, sample, duration, blinding/allocation if stated.
- clinicalRelevance (string): implications for PT practice: who benefits, how much, dosage.
- limitations (string): main limitations in 1-3 sentences.
- evidenceLevel (string): one of ["Systematic Review","Meta-analysis","Randomized Controlled Trial","Cohort","Case-Control","Case Series","Case Report","Guideline","Other"].
- confidenceScore (number): 0-100 confidence in the above summary.

Study: ${meta.title}
Authors: ${meta.authors.join(", ")}

${
  isSections
    ? `
RESULTS: ${s?.results ?? ""}
DISCUSSION: ${s?.discussion ?? ""}
LIMITATIONS: ${s?.limitations ?? ""}
METHODS: ${s?.methods ?? ""}
CONCLUSION: ${s?.conclusion ?? ""}
`
    : `Text: ${fullText.slice(0, 8000)}`
}

Be factual, concise, and clinically focused. If uncertain, lower confidenceScore.
`.trim()
}

export function buildChunkPrompt(meta: PaperMeta, chunk: string, index: number) {
  return `
You are analyzing part ${index + 1} of a physical therapy research paper. Extract structured notes.

Output ONLY valid JSON with keys:
- methodsNotes (string)
- resultsNotes (string)
- limitationsNotes (string)
- conclusionNotes (string)
- stats (string)

Metadata:
Title: ${meta.title}
Authors: ${meta.authors.join(", ")}

Chunk:
${chunk.slice(0, 24000)}
`.trim()
}

export function buildSynthesisPrompt(meta: PaperMeta, sections: Sections, chunkNotesJson: string) {
  return `
You are synthesizing an overall review of the paper for clinicians from sectioned text and chunk notes.

Return ONLY valid JSON with keys:
summary, methodology, findings, limitations, conclusion, clinicalRelevance, qualityScore, applicabilityScore, evidenceLevel, riskOfBias {selection,performance,detection,attrition,reporting}, keyStats, confidence.

Metadata:
- Title: ${meta.title}
- Authors: ${meta.authors.join(", ")}

Sections:
ABSTRACT:
${sections.abstract ?? ""}

METHODS:
${sections.methods ?? ""}

RESULTS:
${sections.results ?? ""}

DISCUSSION:
${sections.discussion ?? ""}

CONCLUSION:
${sections.conclusion ?? ""}

LIMITATIONS:
${sections.limitations ?? ""}

Chunk notes (JSON array):
${chunkNotesJson}

Synthesis guidance:
- Prefer explicit statements in METHODS/RESULTS/DISCUSSION/CONCLUSION.
- Ensure "limitations" and "conclusion" are present and specific.
- Include key quantitative stats in "keyStats".
- Assign evidenceLevel and riskOfBias based on study design cues.
- Provide balanced "clinicalRelevance" with who-benefits, how-much, how-often, and setting.
`.trim()
}

export function buildComparePrompt(
  metas: Array<{ title: string; authors: string[]; journal?: string; publicationDate?: string; abstract: string }>,
  analyses: string[],
) {
  return `
Compare these PT studies. Return ONLY valid JSON with:
- takeaway (string): Main clinical takeaway in 2-3 sentences

Studies: ${metas.map((m, i) => `${i + 1}. ${m.title}`).join("\n")}
Analyses: ${analyses.join("\n")}
`.trim()
}
