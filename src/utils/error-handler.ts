import { ERROR_MESSAGES } from "@/lib/constants"

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode = 500,
  ) {
    super(message)
    this.name = "AppError"
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, "VALIDATION_ERROR", 400)
    this.name = "ValidationError"
  }
}

export class NetworkError extends AppError {
  constructor(message: string = ERROR_MESSAGES.NETWORK) {
    super(message, "NETWORK_ERROR", 503)
    this.name = "NetworkError"
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(service: string) {
    super(`${service} is currently unavailable`, "SERVICE_UNAVAILABLE", 503)
    this.name = "ServiceUnavailableError"
  }
}

export function handleApiError(error: unknown): Response {
  console.error("API Error:", error)

  if (error instanceof AppError) {
    return new Response(
      JSON.stringify({
        error: error.message,
        code: error.code,
      }),
      {
        status: error.statusCode,
        headers: { "Content-Type": "application/json" },
      },
    )
  }

  return new Response(
    JSON.stringify({
      error: ERROR_MESSAGES.GENERIC,
      code: "INTERNAL_ERROR",
    }),
    {
      status: 500,
      headers: { "Content-Type": "application/json" },
    },
  )
}
