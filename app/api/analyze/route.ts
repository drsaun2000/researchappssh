import type { NextRequest } from "next/server"
import { buildAnalysisPrompt } from "@/ai-services/prompts"
import { modelChooser } from "@/ai-services/client"
import { parseSections, type Sections } from "@/file-processing/sections"

export const maxDuration = 60

async function toJSONOrRepair(text: string) {
  try {
    return JSON.parse(text)
  } catch {
    const match = text.match(/\{[\s\S]*\}$/)
    if (match) {
      try {
        return JSON.parse(match[0])
      } catch {}
    }
    return null
  }
}

export async function POST(req: NextRequest) {
  console.log("=== FAST ANALYZE API CALLED ===")

  try {
    const body = await req.json()
    const { meta, content } = body as {
      meta: {
        id: string
        title: string
        authors: string[]
        abstract: string
        journal?: string
        publicationDate?: string
      }
      content: string
    }

    const now = new Date().toISOString()
    const textContent = content || ""
    const sections: Sections = parseSections(textContent || (meta as any).abstract || "")

    // Request richer fields in a single fast call
    const prompt = buildAnalysisPrompt(meta as any, sections)
    const { text, model } = await modelChooser.call({ prompt })
    const data = await toJSONOrRepair(text)

    // Fallbacks if AI shape differs or parsing failed
    const keyFindings: string[] = Array.isArray(data?.keyFindings)
      ? data.keyFindings
          .slice(0, 5)
          .map((s: any) => String(s))
          .filter(Boolean)
      : []
    const findingsStr =
      (data?.findings as string) || (keyFindings.length ? keyFindings.join(" ") : "No key findings extracted")
    const limitationsStr = (data?.limitations as string) || "No limitations identified"

    const confidenceScore: number =
      typeof data?.confidenceScore === "number"
        ? Math.max(0, Math.min(100, data.confidenceScore))
        : typeof data?.confidence === "number"
          ? Math.round(Math.max(0, Math.min(1, data.confidence)) * 100)
          : 55

    return Response.json({
      ok: true,
      model,
      analysis: {
        paperId: meta.id,
        createdAt: now,
        model,
        findings: findingsStr,
        limitations: limitationsStr,
        keyFindings,
        methodology: (data?.methodology as string) || "",
        clinicalRelevance: (data?.clinicalRelevance as string) || "",
        evidenceLevel: (data?.evidenceLevel as string) || "",
        confidence: confidenceScore / 100,
        confidenceScore,
      },
    })
  } catch (e: any) {
    console.error("Analysis error:", e)
    return Response.json({ ok: false, error: e.message }, { status: 500 })
  }
}
