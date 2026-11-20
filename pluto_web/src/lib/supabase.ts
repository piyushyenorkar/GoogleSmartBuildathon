import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('[PLUTO] Missing Supabase env vars. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.')
}

// No-op lock bypasses navigator.locks which causes deadlocks on SPA page reload
async function lockNoOp<R>(_name: string, _acquireTimeout: number, fn: () => Promise<R>): Promise<R> {
  return await fn()
}

// Custom fetch to prevent infinite hangs when tabs are backgrounded
const customFetch = (url: RequestInfo | URL, options?: RequestInit) => {
  const isStorage = typeof url === 'string' && url.includes('/storage/v1/')
  const timeoutMs = isStorage ? 60000 : 30000 // 60s for storage, 30s for db queries

  const controller = new AbortController()
  const timeoutId = setTimeout(() => {
    controller.abort(new Error('Request timed out due to background tab or network issue.'))
  }, timeoutMs)

  if (options?.signal) {
    options.signal.addEventListener('abort', () => {
      clearTimeout(timeoutId)
      controller.abort()
    })
  }

  return fetch(url, { ...options, signal: controller.signal })
    .then((res) => {
      clearTimeout(timeoutId)
      return res
    })
    .catch((err) => {
      clearTimeout(timeoutId)
      throw err
    })
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    lock: lockNoOp as any,
    storageKey: 'pluto-supabase-auth',
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  global: {
    fetch: customFetch,
  },
})
