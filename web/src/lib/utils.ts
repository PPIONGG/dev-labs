import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * รวม class names + dedupe tailwind conflicts
 * ใช้เหมือน shadcn: `cn('px-4', condition && 'bg-red-500')`
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Validate `?next=...` redirect target — ป้องกัน open redirect
 * อนุญาตเฉพาะ relative path (`/foo`) — ห้าม `//evil.com` หรือ `https://...`
 */
export function safeRedirect(next: string | null | undefined, fallback = '/'): string {
  if (!next) return fallback
  // Must start with single slash, not protocol-relative `//` or scheme `http:`
  if (!next.startsWith('/')) return fallback
  if (next.startsWith('//')) return fallback
  // Block any encoded scheme like `/%2F%2Fevil.com`
  try {
    const decoded = decodeURIComponent(next)
    if (decoded.startsWith('//') || /^[a-z][a-z0-9+\-.]*:/i.test(decoded)) {
      return fallback
    }
  } catch {
    return fallback
  }
  return next
}
