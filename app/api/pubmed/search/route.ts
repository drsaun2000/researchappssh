import { NextRequest } from "next/server"
import { searchPubMed } from "@/pubmed-integration/client"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get("q") || "physical therapy"
  const max = Number(searchParams.get("max") || 10)
  const data = await searchPubMed({ q, max })
  return Response.json({ ok: true, items: data })
}
