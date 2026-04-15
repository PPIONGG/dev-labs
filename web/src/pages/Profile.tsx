import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import {
  LogOut,
  Mail,
  Calendar,
  ArrowRight,
  type LucideIcon,
} from 'lucide-react'
import {
  Avatar,
  AvatarFallback,
} from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/hooks/useAuth'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useEffect, useState } from 'react'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { useProgress } from '@/components/ProgressProvider'
import { useContentIndex } from '@/hooks/useContent'
import { findStackMeta, TINT } from '@/lib/stacks'

interface StackProgress {
  slug: string
  name: string
  icon: LucideIcon
  total: number
  done: number
  iconClass: string
  iconBg: string
}

function initials(name: string | null, email: string) {
  if (name) {
    return name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  }
  return email.slice(0, 2).toUpperCase()
}

function formatJoinedDate(iso: string) {
  try {
    return new Intl.DateTimeFormat('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(iso))
  } catch {
    return iso.split('T')[0]
  }
}

export default function Profile() {
  useDocumentTitle('โปรไฟล์ · Dev Labs')
  const { user, logout } = useAuth()
  const { isDone } = useProgress()
  const { data: contentIndex } = useContentIndex()

  if (!user) return null // ProtectedRoute จะ redirect ไปก่อนถึงตรงนี้

  // Derive progress per stack จาก content index + done set
  const stackProgress: StackProgress[] = (contentIndex?.stacks ?? []).map((s) => {
    const meta = findStackMeta(s.slug) ?? findStackMeta('docker')!
    const tint = TINT[meta.tint]
    return {
      slug: s.slug,
      name: s.name,
      icon: meta.icon,
      iconClass: tint.icon,
      iconBg: tint.bg,
      total: s.labs.length,
      done: s.labs.filter((l) => isDone(l.slug)).length,
    }
  })

  const totalLabs = stackProgress.reduce((sum, s) => sum + s.total, 0)
  const totalDone = stackProgress.reduce((sum, s) => sum + s.done, 0)
  const overallPct = totalLabs > 0 ? Math.round((totalDone / totalLabs) * 100) : 0

  const handleLogout = async () => {
    try {
      await logout()
      toast.success('ออกจากระบบแล้ว')
    } catch {
      toast.error('ออกจากระบบไม่สำเร็จ')
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
      {/* Header card */}
      <Card className="mb-8">
        <CardContent className="flex flex-col items-start gap-6 p-6 sm:flex-row sm:items-center">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="bg-primary text-base font-medium text-primary-foreground">
              {initials(user.displayName, user.email)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              // your account
            </div>
            <h1 className="mt-1 font-display text-2xl font-bold tracking-tight sm:text-3xl">
              {user.displayName ?? 'นักเรียน'}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                {user.email}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                เข้าร่วม {formatJoinedDate(user.createdAt)}
              </span>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="cursor-pointer self-start sm:self-auto"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            ออกจากระบบ
          </Button>
        </CardContent>
      </Card>

      {/* Overall progress */}
      <section className="mb-8">
        <div className="mb-3 flex items-end justify-between">
          <div>
            <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              // overall progress
            </div>
            <h2 className="mt-1 font-display text-xl font-bold tracking-tight">
              ความคืบหน้ารวม
            </h2>
          </div>
          <div className="text-right">
            <div className="font-display text-3xl font-bold tabular-nums">
              {overallPct}
              <span className="ml-0.5 text-base font-normal text-muted-foreground">
                %
              </span>
            </div>
            <div className="font-mono text-xs text-muted-foreground">
              {totalDone} / {totalLabs} labs
            </div>
          </div>
        </div>
        <ProgressBar value={overallPct} ariaLabel="ความคืบหน้ารวม" height="h-2" />

        {totalDone === 0 && (
          <p className="mt-3 text-sm text-muted-foreground">
            ยังไม่ได้เริ่ม lab ไหนเลย — เริ่มที่ stack แรกได้เลย ↓
          </p>
        )}
      </section>

      <Separator className="my-8" />

      {/* Per-stack progress */}
      <section>
        <div className="mb-4">
          <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            // by stack
          </div>
          <h2 className="mt-1 font-display text-xl font-bold tracking-tight">
            ความคืบหน้าแยกตาม stack
          </h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {stackProgress.map((s) => {
            const Icon = s.icon
            const pct = s.total > 0 ? Math.round((s.done / s.total) * 100) : 0
            return (
              <Link
                key={s.slug}
                to={`/${s.slug}`}
                className="group cursor-pointer rounded-xl focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <Card className="transition-colors hover:border-foreground/30">
                  <CardHeader className="flex-row items-start gap-4 space-y-0 pb-3">
                    <div
                      className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${s.iconBg}`}
                      aria-hidden="true"
                    >
                      <Icon className={`h-5 w-5 ${s.iconClass}`} />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="flex items-center justify-between font-display text-base tracking-tight">
                        {s.name}
                        <ArrowRight
                          className="h-4 w-4 translate-x-0 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100"
                          aria-hidden="true"
                        />
                      </CardTitle>
                      <CardDescription className="font-mono text-xs">
                        {s.done} / {s.total} labs · {pct}%
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ProgressBar value={pct} ariaLabel={`${s.name} progress`} height="h-1.5" />
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}

/**
 * Animated progress bar — start ที่ 0 → animate ไปค่าจริง 700ms ตอน mount
 * (เคารพ prefers-reduced-motion → set ค่าเลย)
 */
function ProgressBar({
  value,
  ariaLabel,
  height = 'h-2',
}: {
  value: number
  ariaLabel: string
  height?: string
}) {
  const reduced = useReducedMotion()
  const [width, setWidth] = useState(reduced ? value : 0)

  useEffect(() => {
    if (reduced) {
      setWidth(value)
      return
    }
    // Delay nudge เพื่อให้ transition กระตุก (browser repaint)
    const id = requestAnimationFrame(() => setWidth(value))
    return () => cancelAnimationFrame(id)
  }, [value, reduced])

  return (
    <div className={`overflow-hidden rounded-full bg-muted ${height}`}>
      <div
        className="h-full rounded-full bg-(--success) transition-[width] duration-700 ease-out"
        style={{ width: `${width}%` }}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={ariaLabel}
      />
    </div>
  )
}
