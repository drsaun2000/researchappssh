// Test suite for PubMed integration
// Run with: npx tsx pubmed-integration/test-integration.ts

import { enhancedSearchPubMed, searchByDomain, getTrendingTopics } from './enhanced-client'
import { assessArticleQuality, validateSearchParams } from './validation'

async function runTests() {
  console.log('🧪 Running PubMed Integration Tests...\n')
  
  // Test 1: Basic search functionality
  console.log('1️⃣ Testing basic search...')
  try {
    const result = await enhancedSearchPubMed({
      q: 'physical therapy knee pain',
      max: 5,
      sort: 'relevance',
      hasAbstract: true
    })
    
    console.log(`✅ Found ${result.articles.length} articles`)
    console.log(`   Total count: ${result.totalCount}`)
    console.log(`   Search time: ${result.searchTime}ms`)
    
    if (result.articles.length > 0) {
      const firstArticle = result.articles[0]
      console.log(`   First article: "${firstArticle.title.slice(0, 50)}..."`)
      console.log(`   Quality score: ${firstArticle.quality?.score}/100`)
    }
  } catch (error) {
    console.error('❌ Basic search failed:', error)
  }
  
  console.log('\n' + '='.repeat(50) + '\n')
  
  // Test 2: Advanced filtering
  console.log('2️⃣ Testing advanced filtering...')
  try {
    const result = await enhancedSearchPubMed({
      q: 'stroke rehabilitation',
      max: 3,
      sort: 'most_cited',
      studyType: 'rct',
      dateRange: { from: 2020, to: 2024 },
      hasAbstract: true,
      minCitations: 1
    })
    
    console.log(`✅ Found ${result.articles.length} RCTs with citations`)
    result.articles.forEach((article, idx) => {
      console.log(`   ${idx + 1}. ${article.title.slice(0, 60)}...`)
      console.log(`      Citations: ${article.citationCount}, Quality: ${article.quality?.score}/100`)
      console.log(`      Study types: ${article.publicationTypes.join(', ')}`)
    })
  } catch (error) {
    console.error('❌ Advanced filtering failed:', error)
  }
  
  console.log('\n' + '='.repeat(50) + '\n')
  
  // Test 3: Domain-specific search
  console.log('3️⃣ Testing domain search...')
  try {
    const result = await searchByDomain('neurological', {
      max: 3,
      sort: 'latest',
      hasAbstract: true
    })
    
    console.log(`✅ Found ${result.articles.length} neurological PT articles`)
    result.articles.forEach((article, idx) => {
      console.log(`   ${idx + 1}. ${article.title.slice(0, 60)}...`)
      console.log(`      Journal: ${article.journal}`)
      console.log(`      Date: ${article.publicationDate}`)
    })
  } catch (error) {
    console.error('❌ Domain search failed:', error)
  }
  
  console.log('\n' + '='.repeat(50) + '\n')
  
  // Test 4: Quality assessment
  console.log('4️⃣ Testing quality assessment...')
  const mockArticle = {
    title: 'Effectiveness of Exercise Therapy for Chronic Low Back Pain: A Randomized Controlled Trial',
    authors: ['Smith J', 'Johnson A', 'Williams B'],
    journal: 'Physical Therapy',
    publicationDate: '2023',
    abstract: 'Background: Chronic low back pain is a major health issue. This randomized controlled trial evaluated the effectiveness of exercise therapy compared to usual care. Methods: 120 participants were randomized to exercise therapy or control groups. Results: Exercise therapy showed significant improvements in pain and disability scores. Conclusion: Exercise therapy is effective for chronic low back pain.',
    citationCount: 25,
    doi: '10.1093/ptj/pzab123',
    pmid: '12345678',
    publicationTypes: ['Randomized Controlled Trial', 'Journal Article'],
    meshTerms: ['Exercise Therapy', 'Low Back Pain', 'Physical Therapy Modalities']
  }
  
  const quality = assessArticleQuality(mockArticle)
  console.log(`✅ Quality assessment completed`)
  console.log(`   Score: ${quality.score}/100`)
  console.log(`   Factors:`)
  Object.entries(quality.factors).forEach(([key, value]) => {
    console.log(`     ${key}: ${value ? '✅' : '❌'}`)
  })
  console.log(`   Recommendations:`)
  quality.recommendations.forEach(rec => {
    console.log(`     • ${rec}`)
  })
  
  console.log('\n' + '='.repeat(50) + '\n')
  
  // Test 5: Parameter validation
  console.log('5️⃣ Testing parameter validation...')
  
  const validParams = { q: 'physical therapy', max: 10, fromYear: 2020, toYear: 2024 }
  const validResult = validateSearchParams(validParams)
  console.log(`✅ Valid parameters: ${validResult.valid}`)
  
  const invalidParams = { q: 'a', max: 200, fromYear: 2025, toYear: 2020 }
  const invalidResult = validateSearchParams(invalidParams)
  console.log(`❌ Invalid parameters: ${invalidResult.valid}`)
  console.log(`   Errors: ${invalidResult.errors.join(', ')}`)
  
  console.log('\n' + '='.repeat(50) + '\n')
  
  // Test 6: Trending topics (commented out as it may take longer)
  console.log('6️⃣ Testing trending topics...')
  try {
    const trending = await getTrendingTopics(7) // Last 7 days
    console.log(`✅ Found ${trending.length} trending articles`)
    if (trending.length > 0) {
      console.log(`   Top trending: "${trending[0].title.slice(0, 60)}..."`)
      console.log(`   Citations: ${trending[0].citationCount}`)
    }
  } catch (error) {
    console.error('❌ Trending topics failed:', error)
  }
  
  console.log('\n' + '='.repeat(50) + '\n')
  
  // Performance and Rate Limiting Test
  console.log('7️⃣ Testing rate limiting and performance...')
  const startTime = Date.now()
  
  try {
    // Make multiple concurrent requests to test rate limiting
    const promises = Array(3).fill(null).map((_, i) => 
      enhancedSearchPubMed({
        q: `physical therapy test ${i}`,
        max: 2,
        sort: 'relevance'
      })
    )
    
    const results = await Promise.all(promises)
    const endTime = Date.now()
    
    console.log(`✅ Completed ${promises.length} concurrent searches`)
    console.log(`   Total time: ${endTime - startTime}ms`)
    console.log(`   Average per search: ${Math.round((endTime - startTime) / promises.length)}ms`)
    
    results.forEach((result, idx) => {
      console.log(`   Search ${idx + 1}: ${result.articles.length} results in ${result.searchTime}ms`)
    })
  } catch (error) {
    console.error('❌ Rate limiting test failed:', error)
  }
  
  console.log('\n🎉 Testing completed!')
}

// Error handling test
async function testErrorHandling() {
  console.log('\n🚨 Testing error handling...')
  
  // Test invalid query
  try {
    await enhancedSearchPubMed({ q: '' })
    console.log('❌ Should have thrown error for empty query')
  } catch (error) {
    console.log('✅ Correctly handled empty query error')
  }
  
  // Test invalid date range
  try {
    await enhancedSearchPubMed({ 
      q: 'test',
      dateRange: { from: 2025, to: 2020 }
    })
    console.log('❌ Should have thrown error for invalid date range')
  } catch (error) {
    console.log('✅ Correctly handled invalid date range error')
  }
}

// Run all tests
if (require.main === module) {
  runTests()
    .then(() => testErrorHandling())
    .then(() => {
      console.log('\n✨ All tests completed successfully!')
      process.exit(0)
    })
    .catch(error => {
      console.error('\n💥 Test suite failed:', error)
      process.exit(1)
    })
}

export { runTests, testErrorHandling }
