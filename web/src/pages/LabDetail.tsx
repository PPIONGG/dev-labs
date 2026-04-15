import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CheckCircle2, Hash, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button, buttonVariants } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Markdown } from '@/components/Markdown'
import { StackLayout } from '@/components/StackLayout'
import { useContentIndex, useLabMarkdown } from '@/hooks/useContent'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useAuth } from '@/hooks/useAuth'
import { findLab, findSiblings, type StackSlug } from '@/lib/content'
import { cn } from '@/lib/utils'

const STACK_SLUGS: StackSlug[] = ['docker', 'postgresql', 'redis', 'mongodb']

function isStackSlug(value: string): value is StackSlug {
  return (STACK_SLUGS as string[]).includes(value)
}

interface TocItem {
  id: string
  text: string
  level: 2 | 3
}

/** Extract H2/H3 headings จาก markdown สำหรับ TOC */
function extractToc(md: string): TocItem[] {
  const result: TocItem[] = []
  const lines = md.split('\n')
  let inCodeBlock = false
  for (const raw of lines) {
    if (raw.startsWith('```')) {
      inCodeBlock = !inCodeBlock
      continue
    }
    if (inCodeBlock) continue
    const m = raw.match(/^(#{2,3})\s+(.+?)\s*$/)
    if (m) {
      const level = m[1].length as 2 | 3
      const text = m[2].replace(/[`*_]/g, '').trim()
      const id = text
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s-]/gu, '')
        .replace(/\s+/g, '-')
      result.push({ id, text, level })
    }
  }
  return result
}

export default function LabDetail() {
  const { stack: stackParam = '', labKey = '' } = useParams()
  const { data: index, loading: indexLoading } = useContentIndex()

  if (!isStackSlug(stackParam)) {
    return <Navigate to="/404" replace />
  }

  const lab = index ? findLab(index, stackParam, labKey) : null
  const siblings = useMemo(
    () => (index ? findSiblings(index, stackParam, labKey) : { prev: null, next: null }),
    [index, stackParam, labKey],
  )

  const { data: markdown, loading: mdLoading, error: mdError } = useLabMarkdown(
    lab?.path,
  )

  return (
    <StackLayout
      currentStack={stackParam}
      currentLabKey={labKey}
      toc={markdown ? <TocPanel markdown={markdown} /> : null}
    >
      <LabDetailInner
        stack={stackParam}
        labKey={labKey}
        lab={lab}
        markdown={markdown}
        loading={indexLoading || mdLoading}
        error={mdError}
        prev={siblings.prev}
        next={siblings.next}
      />
    </StackLayout>
  )
}

function LabDetailInner({
  stack,
  labKey,
  lab,
  markdown,
  loading,
  error,
  prev,
  next,
}: {
  stack: StackSlug
  labKey: string
  lab: ReturnType<typeof findLab>
  markdown: string | null
  loading: boolean
  error: Error | null
  prev: ReturnType<typeof findSiblings>['prev']
  next: ReturnType<typeof findSiblings>['next']
}) {
  useDocumentTitle(lab ? `${lab.title} · Dev Labs` : 'Lab · Dev Labs')

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    )
  }

  if (error || (!lab && !loading)) {
    return (
      <div className="mx-auto max-w-2xl rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
        <p className="font-medium">โหลด lab ไม่สำเร็จ</p>
        <p className="mt-1 text-xs">{error?.message ?? `ไม่พบ ${stack}/${labKey}`}</p>
        <Link
          to={`/${stack}`}
          className={`${buttonVariants({ variant: 'outline', size: 'sm' })} mt-4`}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          กลับ {stack}
        </Link>
      </div>
    )
  }

  if (!markdown || !lab) return null

  return (
    <article className="mx-auto max-w-3xl">
      {/* Breadcrumb */}
      <nav
        className="mb-6 flex items-center gap-2 font-mono text-xs text-muted-foreground"
        aria-label="Breadcrumb"
      >
        <Link to={`/${stack}`} className="cursor-pointer hover:text-foreground">
          {stack}
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-foreground">{lab.labKey}</span>
      </nav>

      {/* Action bar */}
      <div className="mb-6 flex items-center justify-between gap-3 border-b pb-4">
        <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          // lab {String(lab.order).padStart(2, '0')}
        </span>
        <MarkAsDoneButton labSlug={lab.slug} />
      </div>

      {/* Markdown content */}
      <Markdown>{markdown}</Markdown>

      {/* Footer navigation: prev / next */}
      <nav
        className="mt-12 grid gap-3 border-t pt-6 sm:grid-cols-2"
        aria-label="Lab navigation"
      >
        {prev ? (
          <Link
            to={`/${prev.slug}`}
            className="group cursor-pointer rounded-lg border bg-card p-4 transition-colors hover:border-foreground/30"
          >
            <div className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
              <ArrowLeft className="h-3 w-3" aria-hidden="true" />
              ก่อนหน้า · lab {String(prev.order).padStart(2, '0')}
            </div>
            <div className="mt-1 line-clamp-1 text-sm font-medium text-foreground transition-colors group-hover:text-foreground">
              {prev.title}
            </div>
          </Link>
        ) : (
          <div />
        )}
        {next ? (
          <Link
            to={`/${next.slug}`}
            className="group cursor-pointer rounded-lg border bg-card p-4 text-right transition-colors hover:border-foreground/30"
          >
            <div className="flex items-center justify-end gap-1.5 font-mono text-xs text-muted-foreground">
              ถัดไป · lab {String(next.order).padStart(2, '0')}
              <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </div>
            <div className="mt-1 line-clamp-1 text-sm font-medium text-foreground">
              {next.title}
            </div>
          </Link>
        ) : (
          <div />
        )}
      </nav>
    </article>
  )
}

// -------------------- TOC --------------------

function TocPanel({ markdown }: { markdown: string }) {
  const items = useMemo(() => extractToc(markdown), [markdown])
  const [activeId, setActiveId] = useState<string | null>(null)

  // Track active heading ผ่าน IntersectionObserver
  useEffect(() => {
    if (items.length === 0) return
    const headings = items
      .map((i) => document.getElementById(i.id))
      .filter((n): n is HTMLElement => !!n)

    const observer = new IntersectionObserver(
      (entries) => {
        // เลือก entry ที่ visible และอยู่บนสุด
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActiveId(visible[0].target.id)
      },
      { rootMargin: '-80px 0px -70% 0px' },
    )

    headings.forEach((h) => observer.observe(h))
    return () => observer.disconnect()
  }, [items])

  if (items.length === 0) return null

  return (
    <div>
      <div className="mb-3 flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-muted-foreground">
        <Hash className="h-3 w-3" aria-hidden="true" />
        on this page
      </div>
      <ul className="space-y-1 text-sm">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className={cn(
                'block cursor-pointer border-l-2 py-1 transition-colors',
                item.level === 3 && 'pl-5',
                item.level === 2 && 'pl-3',
                activeId === item.id
                  ? 'border-[--success] text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

// -------------------- Mark as Done --------------------

function MarkAsDoneButton({ labSlug }: { labSlug: string }) {
  const { user } = useAuth()
  const [done, setDone] = useState(false) // local-only ตอนนี้

  const handleClick = () => {
    if (!user) {
      toast.info('เข้าสู่ระบบเพื่อบันทึกความคืบหน้า')
      return
    }
    // TODO: เรียก API /api/progress (slice ถัดไป)
    setDone((v) => !v)
    toast.success(done ? 'ยกเลิกการทำเครื่องหมาย' : `ทำเครื่องหมาย ${labSlug} เสร็จแล้ว`)
  }

  return (
    <Button
      variant={done ? 'default' : 'outline'}
      size="sm"
      onClick={handleClick}
      className="cursor-pointer"
    >
      {done ? (
        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Loader2 className="h-4 w-4" aria-hidden="true" />
      )}
      {done ? 'ทำเสร็จแล้ว' : 'Mark as Done'}
    </Button>
  )
}
