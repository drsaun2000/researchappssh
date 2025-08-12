interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>()
  private maxSize: number

  constructor(maxSize = 1000) {
    this.maxSize = maxSize
  }

  set<T>(key: string, data: T, ttl = 3600000): void {
    // Clean up expired entries if cache is getting full
    if (this.cache.size >= this.maxSize) {
      this.cleanup()
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    })
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)

    if (!entry) {
      return null
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  has(key: string): boolean {
    const entry = this.cache.get(key)

    if (!entry) {
      return false
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  private cleanup(): void {
    const now = Date.now()
    const keysToDelete: string[] = []

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach((key) => this.cache.delete(key))

    // If still too many entries, remove oldest ones
    if (this.cache.size >= this.maxSize) {
      const entries = Array.from(this.cache.entries())
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp)

      const toRemove = entries.slice(0, Math.floor(this.maxSize * 0.2))
      toRemove.forEach(([key]) => this.cache.delete(key))
    }
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
    }
  }
}

export const cache = new MemoryCache()

// Cache decorator for functions
export function cached<T extends (...args: any[]) => Promise<any>>(
  ttl = 3600000,
  keyGenerator?: (...args: Parameters<T>) => string,
) {
  return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
    const method = descriptor.value

    descriptor.value = async function (...args: Parameters<T>) {
      const key = keyGenerator ? keyGenerator(...args) : `${propertyName}_${JSON.stringify(args)}`

      const cached = cache.get(key)
      if (cached) {
        return cached
      }

      const result = await method.apply(this, args)
      cache.set(key, result, ttl)
      return result
    }

    return descriptor
  }
}
