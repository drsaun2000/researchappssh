import { generateText } from "ai"
import { BaseService } from "@/services/base.service"
import { AppError, ServiceUnavailableError } from "@/utils/error-handler"
import { logger } from "@/utils/logger"
import { measurePerformance } from "@/lib/performance"
import { APP_CONFIG } from "@/config/app.config"

interface AICallArgs {
  prompt: string
  modelHint?: string
}

interface AIResponse {
  text: string
  model: string
}

/**
 * AI Service for handling LLM interactions with fallback mechanisms
 * Supports Anthropic Claude (preferred) and OpenAI GPT models
 */
export class AIService extends BaseService {
  private static instance: AIService
  private readonly maxRetries = APP_CONFIG.api.retryAttempts
  private readonly defaultTimeout = APP_CONFIG.api.timeout

  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService()
    }
    return AIService.instance
  }

  /**
   * Main entry point for AI text generation
   * Automatically selects the best available model based on API keys
   */
  @measurePerformance("ai-service-call")
  async generateText(args: AICallArgs): Promise<AIResponse> {
    return this.handleRequest(async () => {
      // Prefer Claude if available (higher rate limits and better performance)
      if (this.isAnthropicAvailable()) {
        try {
          logger.info("Using Anthropic Claude for text generation", "AIService")
          return await this.callWithAnthropic(args.prompt)
        } catch (error) {
          logger.error("Claude generation failed", "AIService", error)
          throw new ServiceUnavailableError("Anthropic Claude")
        }
      }

      // Fallback to OpenAI if available
      if (this.isOpenAIAvailable()) {
        logger.info("Using OpenAI for text generation", "AIService")
        const model = args.modelHint || APP_CONFIG.ai.defaultModel
        return await this.callWithOpenAI(args.prompt, model)
      }

      // Return mock response for development/testing
      logger.warn("No AI API keys found, using mock response", "AIService")
      return this.getMockResponse()
    }, "AIService.generateText")
  }

  /**
   * Call Anthropic Claude with automatic model fallback
   */
  private async callWithAnthropic(prompt: string, modelName = "claude-3-5-sonnet-latest"): Promise<AIResponse> {
    const { anthropic } = await this.loadAnthropicProvider()

    try {
      const { text } = await generateText({
        model: anthropic(modelName),
        prompt,
        maxTokens: APP_CONFIG.ai.maxTokens,
        temperature: APP_CONFIG.ai.temperature,
      })

      return { text, model: modelName }
    } catch (error) {
      // Fallback to stable model if latest fails
      if (modelName === "claude-3-5-sonnet-latest") {
        logger.warn("Latest Claude model failed, trying stable version", "AIService")
        return this.callWithAnthropic(prompt, "claude-3-5-sonnet-20241022")
      }
      throw error
    }
  }

  /**
   * Call OpenAI with retry logic and rate limit handling
   */
  private async callWithOpenAI(prompt: string, modelName = "gpt-4o-mini"): Promise<AIResponse> {
    const { openai } = await this.loadOpenAIProvider()

    return this.retry(async () => {
      try {
        const { text } = await generateText({
          model: openai(modelName as any),
          prompt,
          maxTokens: APP_CONFIG.ai.maxTokens,
          temperature: APP_CONFIG.ai.temperature,
        })

        return { text, model: modelName }
      } catch (error: any) {
        if (this.isRateLimitError(error)) {
          const waitTime = this.extractWaitTime(error.message) || 20000
          logger.warn(`Rate limit hit, waiting ${waitTime / 1000}s`, "AIService")
          await this.delay(waitTime)
          throw error // Will be retried by the retry mechanism
        }

        if (this.isQuotaError(error)) {
          throw new AppError(
            "OpenAI quota exceeded. Please add a payment method at https://platform.openai.com/account/billing",
            "QUOTA_EXCEEDED",
            402,
          )
        }

        // Fallback to cheaper model if premium model fails
        if (modelName !== "gpt-4o-mini") {
          logger.warn(`Model ${modelName} failed, falling back to gpt-4o-mini`, "AIService")
          return this.callWithOpenAI(prompt, "gpt-4o-mini")
        }

        throw error
      }
    })
  }

  /**
   * Load Anthropic provider dynamically
   */
  private async loadAnthropicProvider() {
    try {
      const { anthropic } = await import("@ai-sdk/anthropic")
      return { anthropic }
    } catch (error) {
      throw new ServiceUnavailableError("Anthropic provider")
    }
  }

  /**
   * Load OpenAI provider dynamically
   */
  private async loadOpenAIProvider() {
    try {
      const { openai } = await import("@ai-sdk/openai")
      return { openai }
    } catch (error) {
      throw new ServiceUnavailableError("OpenAI provider")
    }
  }

  /**
   * Check if Anthropic API key is available
   */
  private isAnthropicAvailable(): boolean {
    return Boolean(process.env.ANTHROPIC_API_KEY)
  }

  /**
   * Check if OpenAI API key is available
   */
  private isOpenAIAvailable(): boolean {
    return Boolean(process.env.OPENAI_API_KEY)
  }

  /**
   * Check if error is due to rate limiting
   */
  private isRateLimitError(error: any): boolean {
    const message = error.message?.toLowerCase() || ""
    return message.includes("rate limit") || message.includes("429")
  }

  /**
   * Check if error is due to quota exceeded
   */
  private isQuotaError(error: any): boolean {
    const message = error.message?.toLowerCase() || ""
    return message.includes("quota") || message.includes("billing")
  }

  /**
   * Extract wait time from rate limit error message
   */
  private extractWaitTime(message: string): number | null {
    const waitMatch = message.match(/try again in (\d+)s/)
    return waitMatch ? Number.parseInt(waitMatch[1]) * 1000 : null
  }

  /**
   * Get mock response for development/testing
   */
  private getMockResponse(): AIResponse {
    const mockAnalysis = {
      summary:
        "This study evaluates a physical therapy intervention with moderate methodological rigor and reports modest improvements in functional outcomes.",
      methodology:
        "Prospective randomized design with allocation concealment; assessor blinding unclear; 12-week follow-up; partial intention-to-treat.",
      findings: "10-15% improvement vs control on function; pain reduced by ~1.2/10.",
      limitations: "Small N, performance bias risk, single-center limits generalizability.",
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

    return {
      text: JSON.stringify(mockAnalysis),
      model: "mock-development",
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

// Export singleton instance
export const aiService = AIService.getInstance()

// Legacy export for backward compatibility
export const modelChooser = {
  name: "auto",
  call: (args: AICallArgs) => aiService.generateText(args),
}
