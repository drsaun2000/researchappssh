type LogLevel = "debug" | "info" | "warn" | "error"

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: string
  data?: any
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === "development"

  private log(level: LogLevel, message: string, context?: string, data?: any): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      data,
    }

    if (this.isDevelopment) {
      console[level === "debug" ? "log" : level](
        `[${entry.timestamp}] ${level.toUpperCase()}${context ? ` [${context}]` : ""}: ${message}`,
        data ? data : "",
      )
    } else {
      // In production, you might want to send logs to a service
      console[level === "debug" ? "log" : level](JSON.stringify(entry))
    }
  }

  debug(message: string, context?: string, data?: any): void {
    this.log("debug", message, context, data)
  }

  info(message: string, context?: string, data?: any): void {
    this.log("info", message, context, data)
  }

  warn(message: string, context?: string, data?: any): void {
    this.log("warn", message, context, data)
  }

  error(message: string, context?: string, data?: any): void {
    this.log("error", message, context, data)
  }
}

export const logger = new Logger()
