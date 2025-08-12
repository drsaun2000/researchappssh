import { APP_CONFIG } from "@/config/app.config"

export abstract class BaseService {
  protected readonly config = APP_CONFIG

  protected async handleRequest<T>(operation: () => Promise<T>, context: string): Promise<T> {
    try {
      return await operation()
    } catch (error) {
      this.logError(error, context)
      throw this.normalizeError(error)
    }
  }

  protected logError(error: unknown, context: string): void {
    console.error(`[${context}] Error:`, error)
  }

  protected normalizeError(error: unknown): Error {
    if (error instanceof Error) {
      return error
    }
    return new Error("An unexpected error occurred")
  }

  protected async retry<T>(
    operation: () => Promise<T>,
    maxAttempts: number = this.config.api.retryAttempts,
  ): Promise<T> {
    let lastError: Error

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("Unknown error")

        if (attempt === maxAttempts) {
          throw lastError
        }

        // Exponential backoff
        await this.delay(Math.pow(2, attempt) * 1000)
      }
    }

    throw lastError!
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
