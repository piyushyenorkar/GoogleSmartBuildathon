/**
 * API wrapper for backend calls.
 * In dev, Vite proxy forwards /api/* → localhost:3001
 * In production (Vercel), /api/* routes to the Express server automatically.
 */

const API_BASE = import.meta.env.VITE_API_BASE || ''

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: Record<string, unknown>
  headers?: Record<string, string>
}

export async function api<T = unknown>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<T> {
  const { method = 'GET', body, headers = {} } = options

  const res = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(error.error || error.message || `API Error ${res.status}`)
  }

  return res.json()
}

// Convenience methods
export const apiGet = <T = unknown>(endpoint: string) => api<T>(endpoint)
export const apiPost = <T = unknown>(endpoint: string, body: Record<string, unknown>) =>
  api<T>(endpoint, { method: 'POST', body })
