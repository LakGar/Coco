/**
 * API helper utilities for consistent error handling and response parsing
 */
import { loggerUtils } from './logger'

export async function fetchWithErrorHandling<T>(
  url: string,
  options?: RequestInit
): Promise<{ data: T | null; error: string | null }> {
  try {
    const response = await fetch(url, options)
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return {
        data: null,
        error: errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`,
      }
    }
    
    const data = await response.json()
    return { data, error: null }
  } catch (error) {
    loggerUtils.logError(error, { type: "fetch_error", url })
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Network error',
    }
  }
}

/**
 * Debounce function to limit rapid API calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * Throttle function to limit API calls to once per period
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

