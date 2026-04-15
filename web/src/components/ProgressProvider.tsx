import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { ApiError, progressApi } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'

interface ProgressContextValue {
  /** Set ของ labSlug ที่ทำเสร็จ */
  done: Set<string>
  /** กำลังโหลดครั้งแรก (ไม่ใช่ตอน mark/unmark) */
  loading: boolean
  /** เช็คว่า lab นี้ทำเสร็จไหม — O(1) */
  isDone: (labSlug: string) => boolean
  /** Mark lab as done — optimistic update + revert on fail */
  markDone: (labSlug: string) => Promise<void>
  /** Unmark — optimistic update + revert on fail */
  markUndone: (labSlug: string) => Promise<void>
  /** Force re-fetch จาก server (เผื่อ sync ข้าม device) */
  refresh: () => Promise<void>
}

const ProgressContext = createContext<ProgressContextValue | null>(null)

/**
 * ProgressProvider — เก็บ Set<labSlug> ที่ user ทำเสร็จ
 *
 * - Auto-fetch เมื่อ user เปลี่ยน (login/logout)
 * - Logout → clear ทันที
 * - Optimistic update: UI เปลี่ยนทันที, revert ถ้า API fail
 *
 * ต้อง wrap ใต้ <AuthProvider>
 */
export function ProgressProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const [done, setDone] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!user) {
      setDone(new Set())
      return
    }
    setLoading(true)
    try {
      const { items } = await progressApi.list()
      setDone(new Set(items.map((i) => i.labSlug)))
    } catch (err) {
      console.error('[progress.refresh]', err)
      // เก็บ state เดิมไว้ ไม่ clear (เผื่อ network fail ชั่วคราว)
    } finally {
      setLoading(false)
    }
  }, [user])

  // Refetch on user change
  useEffect(() => {
    if (authLoading) return
    void refresh()
  }, [authLoading, refresh])

  const isDone = useCallback((labSlug: string) => done.has(labSlug), [done])

  const markDone = useCallback(
    async (labSlug: string) => {
      if (!user) throw new ApiError(401, 'UNAUTHENTICATED')

      // Optimistic
      setDone((prev) => {
        if (prev.has(labSlug)) return prev
        const next = new Set(prev)
        next.add(labSlug)
        return next
      })

      try {
        await progressApi.mark(labSlug)
      } catch (err) {
        // Revert
        setDone((prev) => {
          const next = new Set(prev)
          next.delete(labSlug)
          return next
        })
        throw err
      }
    },
    [user],
  )

  const markUndone = useCallback(
    async (labSlug: string) => {
      if (!user) throw new ApiError(401, 'UNAUTHENTICATED')

      // Optimistic
      setDone((prev) => {
        if (!prev.has(labSlug)) return prev
        const next = new Set(prev)
        next.delete(labSlug)
        return next
      })

      try {
        await progressApi.unmark(labSlug)
      } catch (err) {
        // Revert
        setDone((prev) => {
          const next = new Set(prev)
          next.add(labSlug)
          return next
        })
        throw err
      }
    },
    [user],
  )

  return (
    <ProgressContext.Provider value={{ done, loading, isDone, markDone, markUndone, refresh }}>
      {children}
    </ProgressContext.Provider>
  )
}

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext)
  if (!ctx) {
    throw new Error('useProgress must be used within <ProgressProvider>')
  }
  return ctx
}
