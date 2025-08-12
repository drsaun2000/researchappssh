const EUTILS = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"

export type PubMedSearchParams = {
  q: string
  max?: number
  domain?: string
}

export async function searchPubMed({ q, max = 10 }: PubMedSearchParams) {
  const term = encodeURIComponent(q)
  // Add sort by publication date and restrict to recent papers
  const esearch = `${EUTILS}/esearch.fcgi?db=pubmed&retmode=json&retmax=${max}&term=${term}&sort=date&reldate=365`
  const idsRes = await fetch(esearch)
  const idsJson = await idsRes.json()
  const ids: string[] = idsJson?.esearchresult?.idlist ?? []
  if (!ids.length) return []

  // First get summaries
  const esummary = `${EUTILS}/esummary.fcgi?db=pubmed&retmode=json&id=${ids.join(",")}`
  const sumRes = await fetch(esummary)
  const sumJson = await sumRes.json()
  
  // Then get full abstracts
  const efetch = `${EUTILS}/efetch.fcgi?db=pubmed&retmode=xml&id=${ids.join(",")}`
  const fetchRes = await fetch(efetch)
  const fetchXml = await fetchRes.text()
  
  // Parse abstracts from XML
  const abstracts = parseAbstracts(fetchXml, ids)
  
  const result = ids.map((id) => {
    const r = sumJson?.result?.[id]
    return {
      id,
      pmid: id,
      title: r?.title ?? "Untitled",
      authors: (r?.authors ?? []).map((a: any) => a?.name).filter(Boolean),
      journal: r?.fulljournalname ?? r?.source,
      publicationDate: r?.pubdate,
      abstract: abstracts[id] || "Abstract not available",
    }
  })

  return result
}

// Helper function to parse abstracts from XML
function parseAbstracts(xml: string, ids: string[]): Record<string, string> {
  const abstracts: Record<string, string> = {}
  
  try {
    // Simple regex-based parsing for abstracts
    ids.forEach(id => {
      const pmidPattern = new RegExp(`<PMID[^>]*>${id}</PMID>[\s\S]*?<Abstract[^>]*>([\s\S]*?)</Abstract>`, 'i')
      const match = xml.match(pmidPattern)
      if (match && match[1]) {
        // Clean up abstract text by removing XML tags
        const abstractText = match[1]
          .replace(/<[^>]*>/g, ' ') // Remove all XML tags
          .replace(/\s+/g, ' ') // Normalize whitespace
          .trim()
        abstracts[id] = abstractText
      }
    })
  } catch (error) {
    console.error('Error parsing abstracts:', error)
  }
  
  return abstracts
}
