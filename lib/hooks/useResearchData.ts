import { useState, useEffect } from 'react'
import { ResearchArticle, ResearchSource } from '@/app/api/research/articles/route'

interface UseResearchDataOptions {
  query?: string
  sources?: ResearchSource[]
  limit?: number
}

interface UseResearchDataReturn {
  articles: ResearchArticle[]
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useResearchData({
  query = 'physical therapy',
  sources = [],
  limit = 50
}: UseResearchDataOptions = {}): UseResearchDataReturn {
  const [articles, setArticles] = useState<ResearchArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchArticles = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams({
        q: query,
        limit: limit.toString(),
      })
      
      if (sources.length > 0) {
        params.append('sources', sources.join(','))
      }
      
      const response = await fetch(`/api/research/articles?${params}`)
      const result = await response.json()
      
      if (result.success) {
        setArticles(result.data)
      } else {
        setError(result.error || 'Failed to fetch articles')
        setArticles([])
      }
    } catch (err) {
      setError('Network error occurred')
      setArticles([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchArticles()
  }, [query, sources.join(','), limit])

  return {
    articles,
    loading,
    error,
    refetch: fetchArticles
  }
}
