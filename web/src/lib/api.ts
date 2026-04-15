/**
 * API client — wrapper รอบ fetch ที่ส่ง cookie ไปกับ request เสมอ
 * (`credentials: 'include'` จำเป็นเพราะ JWT อยู่ใน httpOnly cookie)
 */

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export interface ApiUser {
  id: string
  email: string
  displayName: string | null
  createdAt: string
}

/** Error ที่ throw จาก apiFetch — มี status + code ให้ UI เช็ค */
export class ApiError extends Error {
  status: number
  code: string
  details?: unknown

  constructor(status: number, code: string, message?: string, details?: unknown) {
    super(message ?? code)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

async function apiFetch<T = unknown>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...init.headers,
    },
  })

  // Parse body (อาจว่าง เช่น 204)
  const text = await response.text()
  const body = text ? (JSON.parse(text) as unknown) : null

  if (!response.ok) {
    const payload = body as { error?: string; details?: unknown } | null
    throw new ApiError(
      response.status,
      payload?.error ?? 'UNKNOWN',
      `API ${response.status}: ${payload?.error ?? 'error'}`,
      payload?.details,
    )
  }

  return body as T
}

// -------------------- Progress API --------------------

export interface ProgressItem {
  labSlug: string
  completedAt: string
}

export const progressApi = {
  list: () => apiFetch<{ items: ProgressItem[] }>('/progress'),

  mark: (labSlug: string) =>
    apiFetch<{ item: ProgressItem }>('/progress', {
      method: 'POST',
      body: JSON.stringify({ labSlug }),
    }),

  /** unmark — labSlug = "<stack>/<labKey>" — เราส่ง path ตามแยก segment */
  unmark: (labSlug: string) =>
    apiFetch<{ ok: true }>(`/progress/${labSlug}`, {
      method: 'DELETE',
    }),
}

// -------------------- Auth API --------------------

export const authApi = {
  register: (input: { email: string; password: string; displayName?: string }) =>
    apiFetch<{ user: ApiUser }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  login: (input: { email: string; password: string }) =>
    apiFetch<{ user: ApiUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  logout: () =>
    apiFetch<{ ok: true }>('/auth/logout', {
      method: 'POST',
    }),

  me: () => apiFetch<{ user: ApiUser }>('/auth/me'),
}
