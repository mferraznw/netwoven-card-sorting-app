// Cache management utility for the application

export interface CacheItem<T> {
  data: T
  timestamp: number
  expiry: number
}

export class CacheManager {
  private static readonly DEFAULT_EXPIRY = 5 * 60 * 1000 // 5 minutes

  static set<T>(key: string, data: T, expiry: number = this.DEFAULT_EXPIRY): void {
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      expiry
    }
    
    try {
      sessionStorage.setItem(key, JSON.stringify(item))
    } catch (error) {
      console.warn('Failed to cache data:', error)
    }
  }

  static get<T>(key: string): T | null {
    try {
      const cached = sessionStorage.getItem(key)
      if (!cached) return null

      const item: CacheItem<T> = JSON.parse(cached)
      const now = Date.now()
      
      if (now - item.timestamp > item.expiry) {
        this.delete(key)
        return null
      }

      return item.data
    } catch (error) {
      console.warn('Failed to retrieve cached data:', error)
      return null
    }
  }

  static delete(key: string): void {
    try {
      sessionStorage.removeItem(key)
    } catch (error) {
      console.warn('Failed to delete cached data:', error)
    }
  }

  static clear(): void {
    try {
      const keys = Object.keys(sessionStorage)
      keys.forEach(key => {
        if (key.startsWith('sites-') || key.startsWith('graph-') || key.startsWith('changesets-')) {
          sessionStorage.removeItem(key)
        }
      })
    } catch (error) {
      console.warn('Failed to clear cache:', error)
    }
  }

  static isExpired(key: string): boolean {
    try {
      const cached = sessionStorage.getItem(key)
      if (!cached) return true

      const item: CacheItem<any> = JSON.parse(cached)
      const now = Date.now()
      
      return now - item.timestamp > item.expiry
    } catch (error) {
      return true
    }
  }
}

// Cache keys
export const CACHE_KEYS = {
  SITES: 'sites-data',
  GRAPH: 'graph-data',
  CHANGESETS: 'changesets-data'
} as const

// Cache expiry times (in milliseconds)
export const CACHE_EXPIRY = {
  SITES: 5 * 60 * 1000,      // 5 minutes
  GRAPH: 5 * 60 * 1000,      // 5 minutes
  CHANGESETS: 2 * 60 * 1000  // 2 minutes
} as const


