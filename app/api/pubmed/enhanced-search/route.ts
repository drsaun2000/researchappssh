import { NextRequest } from "next/server"
import { enhancedSearchPubMed, type EnhancedPubMedParams, type SortType, type StudyType } from "@/pubmed-integration/enhanced-client"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    
    // Parse query parameters
    const q = searchParams.get("q") || "physical therapy"
    const max = Math.min(Number(searchParams.get("max")) || 20, 100) // Limit to 100 per request
    const offset = Math.max(0, Number(searchParams.get("offset")) || 0)
    const sort = (searchParams.get("sort") || "relevance") as SortType
    const studyType = (searchParams.get("studyType") || "all") as StudyType
    const minCitations = Number(searchParams.get("minCitations")) || undefined
    const hasAbstract = searchParams.get("hasAbstract") === "true"
    
    // Parse date range
    let dateRange
    const fromYear = searchParams.get("fromYear")
    const toYear = searchParams.get("toYear")
    if (fromYear) {
      dateRange = {
        from: Number(fromYear),
        to: toYear ? Number(toYear) : undefined
      }
    }
    
    const params: EnhancedPubMedParams = {
      q,
      max,
      offset,
      sort,
      studyType,
      dateRange,
      minCitations,
      hasAbstract
    }
    
    const result = await enhancedSearchPubMed(params)
    
    return Response.json({
      success: true,
      ...result,
      message: `Found ${result.articles.length} articles in ${result.searchTime}ms`
    })
    
  } catch (error) {
    console.error("Enhanced PubMed search error:", error)
    return Response.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error",
        articles: [],
        totalCount: 0
      },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as EnhancedPubMedParams
    
    // Validate and limit max results
    if (body.max && body.max > 100) {
      body.max = 100
    }
    
    const result = await enhancedSearchPubMed(body)
    
    return Response.json({
      success: true,
      ...result,
      message: `Found ${result.articles.length} articles in ${result.searchTime}ms`
    })
    
  } catch (error) {
    console.error("Enhanced PubMed search error:", error)
    return Response.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error",
        articles: [],
        totalCount: 0
      },
      { status: 500 }
    )
  }
}
