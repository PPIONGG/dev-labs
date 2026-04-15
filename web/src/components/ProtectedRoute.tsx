import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import type { ReactNode } from 'react'

/**
 * Wrap หน้าที่ต้อง login ก่อนเข้า — redirect ไป /login ถ้ายังไม่ได้ login
 *
 * Usage:
 *   <ProtectedRoute><MyPage /></ProtectedRoute>
 *
 * หากยัง loading session อยู่จะแสดง placeholder (ไม่ flash redirect ผิดทาง)
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
        กำลังตรวจสอบสถานะผู้ใช้...
      </div>
    )
  }

  if (!user) {
    const next = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?next=${next}`} replace />
  }

  return <>{children}</>
}
