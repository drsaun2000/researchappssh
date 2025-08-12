import { NextRequest } from "next/server"
import { getTrendingTopics } from "@/pubmed-integration/enhanced-client"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    
    // Parse days parameter (default 30 days)
    const days = Math.min(Number(searchParams.get("days")) || 30, 365) // Max 1 year
    
    const articles = await getTrendingTopics(days)
    
    return Response.json({
      success: true,
      articles,
      period: `${days} days`,
      totalCount: articles.length,
      message: `Found ${articles.length} trending articles from the last ${days} days`
    })
    
  } catch (error) {
    console.error("Trending topics error:", error)
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
