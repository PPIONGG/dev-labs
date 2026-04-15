import { useEffect, useState } from 'react'

/**
 * useState ที่ persist ค่าใน localStorage
 *
 * - SSR safe: คืน `initial` ถ้าไม่มี window
 * - JSON serialize/parse — ระวัง circular structures
 * - Sync ข้าม tabs ผ่าน `storage` event
 */
export function useLocalStorageState<T>(
  key: string,
  initial: T,
): [T, (value: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initial
    try {
      const stored = window.localStorage.getItem(key)
      if (stored === null) return initial
      return JSON.parse(stored) as T
    } catch {
      return initial
    }
  })

  // Persist on change
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // quota exceeded / private mode — ignore silently
    }
  }, [key, value])

  // Sync across tabs
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key !== key || e.newValue === null) return
      try {
        setValue(JSON.parse(e.newValue) as T)
      } catch {
        // ignore parse errors
      }
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [key])

  return [value, setValue]
}
