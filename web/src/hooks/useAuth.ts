import { useCallback, useEffect, useState } from 'react'
import { ApiError, authApi, type ApiUser } from '@/lib/api'

/**
 * Auth state hook — โหลด current user จาก /auth/me
 *
 * เนื่องจาก JWT อยู่ใน httpOnly cookie frontend ไม่ต้องจัดการ token เอง
 * แค่เรียก `/auth/me` ก็รู้ว่า login อยู่หรือเปล่า
 *
 * Usage:
 *   const { user, loading, login, register, logout, refresh } = useAuth()
 */
export function useAuth() {
  const [user, setUser] = useState<ApiUser | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const { user } = await authApi.me()
      setUser(user)
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setUser(null)
      } else {
        console.error('[useAuth.refresh]', err)
        setUser(null)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const login = useCallback(
    async (email: string, password: string) => {
      const { user } = await authApi.login({ email, password })
      setUser(user)
      return user
    },
    [],
  )

  const register = useCallback(
    async (email: string, password: string, displayName?: string) => {
      const { user } = await authApi.register({ email, password, displayName })
      setUser(user)
      return user
    },
    [],
  )

  const logout = useCallback(async () => {
    await authApi.logout()
    setUser(null)
  }, [])

  return { user, loading, login, register, logout, refresh }
}
