import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { ApiError, authApi, type ApiUser } from '@/lib/api'

/**
 * Auth state shared ทั่ว app ผ่าน React Context
 *
 * - ทุก component ที่เรียก `useAuth()` ได้ state เดียวกัน
 * - เมื่อ login/register → setUser → ทุก consumer rerender พร้อมกัน
 */
interface AuthContextValue {
  user: ApiUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<ApiUser>
  register: (email: string, password: string, displayName?: string) => Promise<ApiUser>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
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

  const login = useCallback(async (email: string, password: string) => {
    const { user } = await authApi.login({ email, password })
    setUser(user)
    return user
  }, [])

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

  const value: AuthContextValue = {
    user,
    loading,
    login,
    register,
    logout,
    refresh,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * ใช้ใน component เพื่ออ่าน auth state + เรียก login/register/logout
 * ต้องอยู่ใต้ <AuthProvider>
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within <AuthProvider>')
  }
  return ctx
}
