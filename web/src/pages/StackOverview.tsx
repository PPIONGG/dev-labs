import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowRight, BookOpen } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { StackLayout } from '@/components/StackLayout'
import { useContentIndex } from '@/hooks/useContent'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { findStack, type StackSlug } from '@/lib/content'

const STACK_SLUGS: StackSlug[] = ['docker', 'postgresql', 'redis', 'mongodb']

function isStackSlug(value: string): value is StackSlug {
  return (STACK_SLUGS as string[]).includes(value)
}

/**
 * Stack overview — แสดงรายการ labs ทั้งหมดของ stack
 * Layout: sidebar + content (ไม่มี TOC ในหน้านี้)
 */
export default function StackOverview() {
  const { stack: stackParam = '' } = useParams()
  const { data: index, loading, error } = useContentIndex()

  // Validate stack slug
  if (!isStackSlug(stackParam)) {
    return <Navigate to="/404" replace />
  }

  return (
    <StackLayout currentStack={stackParam}>
      <StackOverviewInner stack={stackParam} index={index} loading={loading} error={error} />
    </StackLayout>
  )
}

function StackOverviewInner({
  stack: stackSlug,
  index,
  loading,
  error,
}: {
  stack: StackSlug
  index: ReturnType<typeof useContentIndex>['data']
  loading: boolean
  error: Error | null
}) {
  const stack = index ? findStack(index, stackSlug) : null
  // Title fallback while loading
  useDocumentTitle(stack ? `${stack.name} · Dev Labs` : 'Dev Labs')

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96" />
        <div className="grid gap-3 sm:grid-cols-2">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    )
  }

  if (error || !stack) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
        ไม่พบ stack นี้ — {error?.message ?? 'unknown'}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          // {stack.slug}
        </div>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">
          {stack.name}
        </h1>
        <p className="mt-3 text-muted-foreground">{stack.description}</p>
        <p className="mt-2 font-mono text-xs text-muted-foreground">
          {stack.labs.length} labs พร้อมเรียน
        </p>
      </div>

      {/* Lab grid */}
      {stack.labs.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
          ยังไม่มี lab ใน stack นี้
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {stack.labs.map((lab) => (
            <Link
              key={lab.slug}
              to={`/${lab.slug}`}
              className="group cursor-pointer rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <Card className="h-full transition-all duration-200 hover:-translate-y-0.5 hover:border-foreground/30 hover:shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted font-mono text-[11px] tabular-nums text-muted-foreground">
                      {String(lab.order).padStart(2, '0')}
                    </div>
                    <div className="min-w-0 flex-1">
                      <CardTitle className="flex items-start justify-between gap-2 font-display text-base leading-snug tracking-tight">
                        <span className="line-clamp-2">{lab.title}</span>
                        <ArrowRight
                          className="mt-1 h-4 w-4 shrink-0 translate-x-0 text-muted-foreground opacity-0 transition-all duration-200 group-hover:translate-x-1 group-hover:opacity-100"
                          aria-hidden="true"
                        />
                      </CardTitle>
                      {lab.description && (
                        <CardDescription className="mt-1.5 line-clamp-2 leading-snug">
                          {lab.description}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex items-center gap-1.5 pt-0 font-mono text-[11px] text-muted-foreground">
                  <BookOpen className="h-3 w-3" aria-hidden="true" />
                  อ่าน lab
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
