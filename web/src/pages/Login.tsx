import { useState, type FormEvent } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { ApiError } from '@/lib/api'

/**
 * หน้า Login — email + password
 * ถ้า login อยู่แล้ว → redirect ไป `?next=` หรือ `/`
 */
export default function Login() {
  const { user, loading, login } = useAuth()
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-[--color-muted-foreground]">
        กำลังโหลด...
      </div>
    )
  }

  if (user) {
    const next = searchParams.get('next') ?? '/'
    return <Navigate to={next} replace />
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await login(email, password)
      // user state อัพเดต → Navigate ใน render จะจัดการ redirect
    } catch (err) {
      setBusy(false)
      if (err instanceof ApiError && err.code === 'INVALID_CREDENTIALS') {
        setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง')
      } else {
        setError('เกิดข้อผิดพลาด ลองใหม่อีกครั้ง')
        console.error(err)
      }
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-lg border border-[--color-border] bg-[--color-card] p-8 shadow-sm">
        <div className="mb-6 text-center">
          <div className="mb-3 text-4xl">🧪</div>
          <h1 className="text-2xl font-semibold text-[--color-foreground]">
            เข้าสู่ Dev Labs
          </h1>
          <p className="mt-2 text-sm text-[--color-muted-foreground]">
            ใส่อีเมลและรหัสผ่านเพื่อเข้าสู่ระบบ
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium">
              อีเมล
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-[--color-border] bg-[--color-background] px-3 py-2 text-sm outline-none focus:border-[--color-accent] focus:ring-1 focus:ring-[--color-accent]"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium">
              รหัสผ่าน
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-[--color-border] bg-[--color-background] px-3 py-2 text-sm outline-none focus:border-[--color-accent] focus:ring-1 focus:ring-[--color-accent]"
            />
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={busy}>
            {busy ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-[--color-muted-foreground]">
          ยังไม่มีบัญชี?{' '}
          <Link to="/register" className="font-medium text-[--color-foreground] hover:underline">
            สมัครสมาชิก
          </Link>
        </p>
      </div>
    </div>
  )
}
