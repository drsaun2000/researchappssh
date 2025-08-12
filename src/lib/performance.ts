interface PerformanceMetrics {
  name: string
  duration: number
  timestamp: number
  metadata?: Record<string, any>
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = []
  private maxMetrics = 1000

  startTimer(name: string): () => void {
    const startTime = performance.now()

    return (metadata?: Record<string, any>) => {
      const duration = performance.now() - startTime
      this.recordMetric(name, duration, metadata)
    }
  }

  recordMetric(name: string, duration: number, metadata?: Record<string, any>): void {
    const metric: PerformanceMetrics = {
      name,
      duration,
      timestamp: Date.now(),
      metadata,
    }

    this.metrics.push(metric)

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics)
    }

    // Log slow operations in development
    if (process.env.NODE_ENV === "development" && duration > 1000) {
      console.warn(`Slow operation detected: ${name} took ${duration.toFixed(2)}ms`, metadata)
    }
  }

  getMetrics(name?: string): PerformanceMetrics[] {
    if (name) {
      return this.metrics.filter((m) => m.name === name)
    }
    return [...this.metrics]
  }

  getAverageTime(name: string): number {
    const nameMetrics = this.getMetrics(name)
    if (nameMetrics.length === 0) return 0

    const total = nameMetrics.reduce((sum, m) => sum + m.duration, 0)
    return total / nameMetrics.length
  }

  clearMetrics(): void {
    this.metrics = []
  }

  getSummary(): Record<string, { count: number; average: number; total: number }> {
    const summary: Record<string, { count: number; average: number; total: number }> = {}

    for (const metric of this.metrics) {
      if (!summary[metric.name]) {
        summary[metric.name] = { count: 0, average: 0, total: 0 }
      }

      summary[metric.name].count++
      summary[metric.name].total += metric.duration
    }

    // Calculate averages
    for (const name in summary) {
      summary[name].average = summary[name].total / summary[name].count
    }

    return summary
  }
}

export const performanceMonitor = new PerformanceMonitor()

// Performance decorator for async functions
export function measurePerformance(name?: string) {
  return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
    const method = descriptor.value
    const metricName = name || `${target.constructor.name}.${propertyName}`

    descriptor.value = async function (...args: any[]) {
      const endTimer = performanceMonitor.startTimer(metricName)

      try {
        const result = await method.apply(this, args)
        endTimer({ success: true })
        return result
      } catch (error) {
        endTimer({ success: false, error: error instanceof Error ? error.message : "Unknown error" })
        throw error
      }
    }

    return descriptor
  }
}
