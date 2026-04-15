import { useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { ApiError } from '@/lib/api'

/**
 * หน้า Register — email + password + displayName (optional)
 * เมื่อสมัครสำเร็จ backend ส่ง cookie กลับ → user state update → redirect
 */
export default function Register() {
  const { user, loading, register } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
        กำลังโหลด...
      </div>
    )
  }

  if (user) {
    return <Navigate to="/" replace />
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await register(email, password, displayName.trim() || undefined)
    } catch (err) {
      setBusy(false)
      if (err instanceof ApiError) {
        if (err.code === 'EMAIL_TAKEN') {
          setError('อีเมลนี้ถูกใช้แล้ว ลองอันอื่นหรือเข้าสู่ระบบแทน')
        } else if (err.code === 'VALIDATION') {
          setError('ข้อมูลไม่ถูกต้อง — รหัสผ่านต้องยาวอย่างน้อย 8 ตัว')
        } else {
          setError('สมัครสมาชิกไม่สำเร็จ ลองใหม่อีกครั้ง')
        }
      } else {
        setError('เกิดข้อผิดพลาด ลองใหม่อีกครั้ง')
        console.error(err)
      }
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-8 shadow-sm">
        <div className="mb-6 text-center">
          <div className="mb-3 text-4xl">🧪</div>
          <h1 className="text-2xl font-semibold text-foreground">
            สร้างบัญชีใหม่
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            ใช้ฟรี บันทึกความคืบหน้าและโน้ตส่วนตัวได้
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="displayName" className="mb-1 block text-sm font-medium">
              ชื่อที่แสดง <span className="text-muted-foreground">(ไม่บังคับ)</span>
            </label>
            <input
              id="displayName"
              type="text"
              autoComplete="name"
              maxLength={100}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            />
          </div>

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
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium">
              รหัสผ่าน <span className="text-muted-foreground">(อย่างน้อย 8 ตัว)</span>
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            />
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={busy}>
            {busy ? 'กำลังสมัคร...' : 'สมัครสมาชิก'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          มีบัญชีอยู่แล้ว?{' '}
          <Link to="/login" className="font-medium text-foreground hover:underline">
            เข้าสู่ระบบ
          </Link>
        </p>
      </div>
    </div>
  )
}
