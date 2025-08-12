import { NextRequest } from "next/server"
import { searchByDomain, PT_DOMAINS, type PTDomain, type EnhancedPubMedParams, type SortType, type StudyType } from "@/pubmed-integration/enhanced-client"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    
    // Parse parameters
    const domain = searchParams.get("domain") as PTDomain
    const max = Math.min(Number(searchParams.get("max")) || 20, 50) // Limit domain searches
    const sort = (searchParams.get("sort") || "latest") as SortType
    const studyType = (searchParams.get("studyType") || "all") as StudyType
    const hasAbstract = searchParams.get("hasAbstract") !== "false" // Default true for domains
    
    // Validate domain
    if (!domain || !PT_DOMAINS[domain]) {
      return Response.json(
        { 
          success: false, 
          error: "Invalid domain. Available domains: " + Object.keys(PT_DOMAINS).join(", "),
          availableDomains: Object.keys(PT_DOMAINS)
        },
        { status: 400 }
      )
    }
    
    // Parse date range - default to last 2 years for domain searches
    let dateRange = {
      from: new Date().getFullYear() - 2
    }
    
    const fromYear = searchParams.get("fromYear")
    const toYear = searchParams.get("toYear")
    if (fromYear) {
      dateRange = {
        from: Number(fromYear),
        to: toYear ? Number(toYear) : undefined
      }
    }
    
    const params: Omit<EnhancedPubMedParams, 'q'> = {
      max,
      sort,
      studyType,
      dateRange,
      hasAbstract
    }
    
    const result = await searchByDomain(domain, params)
    
    return Response.json({
      success: true,
      domain,
      domainDescription: PT_DOMAINS[domain],
      ...result,
      message: `Found ${result.articles.length} ${domain} articles in ${result.searchTime}ms`
    })
    
  } catch (error) {
    console.error("Domain search error:", error)
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

// Get available domains
export async function OPTIONS() {
  return Response.json({
    availableDomains: Object.entries(PT_DOMAINS).map(([key, description]) => ({
      key,
      description,
      displayName: key.charAt(0).toUpperCase() + key.slice(1)
    }))
  })
}
