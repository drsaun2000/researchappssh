import { generateText } from "ai"

type CallArgs = { prompt: string; modelHint?: string }

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function callWithAnthropic(prompt: string, modelName: string = "claude-3-5-sonnet-latest") {
  const { anthropic } = await import("@ai-sdk/anthropic").catch(() => ({ anthropic: null as any }))
  if (!anthropic) throw new Error("Anthropic provider not available")
  
  try {
    const { text } = await generateText({
      // @ts-ignore
      model: anthropic(modelName),
      prompt,
    })
    return { text, model: modelName }
  } catch (e: any) {
    // If the latest model fails, try the regular sonnet
    if (modelName === "claude-3-5-sonnet-latest") {
      console.log("Latest model failed, trying claude-3-5-sonnet-20241022")
      return await callWithAnthropic(prompt, "claude-3-5-sonnet-20241022")
    }
    throw e
  }
}

async function callWithOpenAI(prompt: string, modelName: string = "gpt-4o-mini", retries = 3) {
  const { openai } = await import("@ai-sdk/openai").catch(() => ({ openai: null as any }))
  if (!openai) throw new Error("OpenAI provider not available")
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const { text } = await generateText({
        model: openai(modelName as any),
        prompt,
      })
      return { text, model: modelName }
    } catch (e: any) {
      const isRateLimit = e.message?.includes("Rate limit reached") || e.message?.includes("429")
      const isQuotaExceeded = e.message?.includes("quota") || e.message?.includes("billing")
      
      if (isRateLimit && attempt < retries) {
        const waitMatch = e.message.match(/try again in (\d+)s/)
        const waitTime = waitMatch ? parseInt(waitMatch[1]) * 1000 : 20000
        console.log(`Rate limit hit, waiting ${waitTime/1000}s before retry ${attempt}/${retries}`)
        await sleep(waitTime)
        continue
      }
      
      if (isQuotaExceeded) {
        throw new Error("OpenAI quota exceeded. Please add a payment method at https://platform.openai.com/account/billing")
      }
      
      if (modelName !== "gpt-4o-mini" && attempt === 1) {
        console.log(`Model ${modelName} failed, falling back to gpt-4o-mini`)
        return await callWithOpenAI(prompt, "gpt-4o-mini", retries - 1)
      }
      
      if (attempt === retries) {
        throw new Error(`OpenAI call failed after ${retries} attempts: ${e.message}`)
      }
    }
  }
  
  throw new Error("Unexpected error in OpenAI call")
}

export const modelChooser = {
  name: "auto",
  async call({ prompt, modelHint }: CallArgs): Promise<{ text: string; model: string }> {
    // Prefer Claude if key present (much higher rate limits)
    if (typeof process !== "undefined" && process.env?.ANTHROPIC_API_KEY) {
      try {
        console.log("Using Anthropic Claude for analysis")
        return await callWithAnthropic(prompt)
      } catch (e: any) {
        console.log("Claude failed:", e.message)
        // Don't fall through to OpenAI if we have Claude key but it fails
        throw new Error(`Claude analysis failed: ${e.message}`)
      }
    }
    
    // Use OpenAI if key present (as fallback)
    if (typeof process !== "undefined" && process.env?.OPENAI_API_KEY) {
      console.log("Using OpenAI for analysis")
      const model = (modelHint || "gpt-4o-mini") as string
      return await callWithOpenAI(prompt, model)
    }
    
    // Mock if no keys
    console.log("No API keys found, using mock analysis")
    const mock = {
      summary:
        "This study evaluates a physical therapy intervention with moderate methodological rigor and reports modest improvements in functional outcomes.",
      methodology:
        "Prospective randomized design with allocation concealment; assessor blinding unclear; 12-week follow-up; partial intention-to-treat.",
      findings:
        "10-15% improvement vs control on function; pain reduced by ~1.2/10.",
      limitations:
        "Small N, performance bias risk, single-center limits generalizability.",
      conclusion:
        "Intervention shows modest benefit as adjunct to standard exercise; further multicenter trials needed.",
      clinicalRelevance:
        "Applicable in outpatient ortho PT; consider 2-3 sessions/week for 12 weeks alongside progressive exercise.",
      qualityScore: 72,
      applicabilityScore: 78,
      evidenceLevel: "Randomized Controlled Trial",
      riskOfBias: {
        selection: "Low",
        performance: "Some concerns",
        detection: "Some concerns",
        attrition: "Low",
        reporting: "Low",
      },
      keyStats: "MD +12.3 (95% CI 6.2 to 18.4); N=84; dropout 8%",
      confidence: 0.55,
    }
    return { text: JSON.stringify(mock), model: "mock" }
  },
}
