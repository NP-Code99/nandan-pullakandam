import type { Item } from '../types'

export const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
}

// Exponential backoff retry function
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = RETRY_CONFIG.maxRetries,
  baseDelay: number = RETRY_CONFIG.baseDelay
): Promise<T> {
  let lastError: Error
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      
      if (attempt === maxRetries) {
        throw lastError
      }
      
      // Calculate delay with exponential backoff and jitter
      const delay = Math.min(
        baseDelay * Math.pow(2, attempt) + Math.random() * 1000,
        RETRY_CONFIG.maxDelay
      )
      
      console.warn(`Request failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${Math.round(delay)}ms:`, error)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError!
}

export async function listItems(): Promise<Item[]> {
  return retryWithBackoff(async () => {
    const res = await fetch(`${BASE_URL}/items`)
    if (!res.ok) throw new Error(`Failed to fetch items: ${res.status} ${res.statusText}`)
    return res.json()
  })
}

export async function createItem(text: string): Promise<Item> {
  return retryWithBackoff(async () => {
    const res = await fetch(`${BASE_URL}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })
    if (!res.ok) throw new Error(`Failed to create item: ${res.status} ${res.statusText}`)
    return res.json()
  })
}


