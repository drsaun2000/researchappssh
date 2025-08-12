export async function GET() {
  const hasOpenAI = !!process.env.OPENAI_API_KEY
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY
  
  let provider = "mock"
  if (hasAnthropic) {
    provider = "anthropic"
  } else if (hasOpenAI) {
    provider = "openai"
  }
  
  return Response.json({ 
    ok: true, 
    provider, 
    hasOpenAI, 
    hasAnthropic,
    recommendation: hasAnthropic ? "Using Claude (recommended)" : hasOpenAI ? "Using OpenAI" : "Add ANTHROPIC_API_KEY for best results"
  })
}
