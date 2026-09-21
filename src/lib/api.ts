/**
 * Minimal typed fetch client for the Stock Intelligence V1 backend.
 * Base URL defaults to same-origin (Vite dev proxy forwards /api + /actuator
 * to the configured backend). Override with VITE_API_URL for production.
 */
import type { ApiErrorBody } from './types'

const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? ''

export class ApiError extends Error {
  status: number
  body?: ApiErrorBody
  constructor(status: number, message: string, body?: ApiErrorBody) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

function buildUrl(path: string, params?: Record<string, string | number | undefined | null>): string {
  const qs = new URLSearchParams()
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '' && !(typeof v === 'number' && Number.isNaN(v))) qs.append(k, String(v))
    }
  }
  const query = qs.toString()
  return `${BASE_URL}${path}${query ? `?${query}` : ''}`
}

function friendlyMessage(status: number, body?: ApiErrorBody, fallback?: string): string {
  const serverMsg = body?.error || body?.message
  if (serverMsg) return serverMsg
  if (status === 0) return 'Cannot reach the backend. Please retry shortly.'
  if (status === 400) return fallback ?? 'Invalid request. Please check the form values.'
  if (status === 404) return fallback ?? 'Resource not found. It may have been deleted.'
  if (status === 502) return 'Market-data provider is unavailable. Please retry shortly.'
  if (status >= 500) return fallback ?? 'Server error. Please retry shortly.'
  return fallback ?? `Request failed (HTTP ${status}).`
}

async function request<T>(path: string, init?: RequestInit, params?: Record<string, string | number | undefined | null>): Promise<T> {
  let res: Response
  const hasBody = init?.body !== undefined
  try {
    res = await fetch(buildUrl(path, params), {
      ...init,
      headers: { ...(hasBody ? { 'Content-Type': 'application/json' } : {}), ...(init?.headers ?? {}) },
    })
  } catch {
    throw new ApiError(0, 'Cannot reach the backend. Please retry shortly.')
  }
  if (res.status === 204) return undefined as T
  const text = await res.text()
  const data = text ? safeJson(text) : undefined
  if (!res.ok) {
    const body = (typeof data === 'object' && data !== null ? (data as ApiErrorBody) : undefined)
    throw new ApiError(res.status, friendlyMessage(res.status, body), body)
  }
  return (data ?? undefined) as T
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return undefined
  }
}

export const api = {
  get: <T,>(path: string, params?: Record<string, string | number | undefined | null>) =>
    request<T>(path, { method: 'GET' }, params),
  post: <T,>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) }),
  put: <T,>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body: body === undefined ? undefined : JSON.stringify(body) }),
  del: <T,>(path: string) => request<T>(path, { method: 'DELETE' }),
}

export function getApiErrorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message
  if (err instanceof Error) return err.message
  return 'Something went wrong. Please retry.'
}
