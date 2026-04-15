import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Container,
  Database,
  Flame,
  Leaf,
  Search,
  ArrowRight,
  Terminal,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/hooks/useAuth'

interface Stack {
  slug: string
  name: string
  description: string
  labCount: number
  icon: LucideIcon
  tint: string
}

const STACKS: Stack[] = [
  {
    slug: 'docker',
    name: 'Docker',
    description: 'Container, Compose, Kubernetes, CI/CD',
    labCount: 19,
    icon: Container,
    tint: 'sky',
  },
  {
    slug: 'postgresql',
    name: 'PostgreSQL',
    description: 'SQL, Indexing, Transactions, Performance',
    labCount: 17,
    icon: Database,
    tint: 'indigo',
  },
  {
    slug: 'redis',
    name: 'Redis',
    description: 'In-memory, Caching, Pub/Sub, Streams',
    labCount: 14,
    icon: Flame,
    tint: 'rose',
  },
  {
    slug: 'mongodb',
    name: 'MongoDB',
    description: 'NoSQL, Schema design, Aggregation',
    labCount: 15,
    icon: Leaf,
    tint: 'emerald',
  },
]

const TINT_STYLES: Record<string, { icon: string; bg: string }> = {
  sky: {
    icon: 'text-sky-600 dark:text-sky-400',
    bg: 'bg-sky-500/10 ring-1 ring-sky-500/20',
  },
  indigo: {
    icon: 'text-indigo-600 dark:text-indigo-400',
    bg: 'bg-indigo-500/10 ring-1 ring-indigo-500/20',
  },
  rose: {
    icon: 'text-rose-600 dark:text-rose-400',
    bg: 'bg-rose-500/10 ring-1 ring-rose-500/20',
  },
  emerald: {
    icon: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-500/10 ring-1 ring-emerald-500/20',
  },
}

const TOTAL_LABS = STACKS.reduce((sum, s) => sum + s.labCount, 0)

export default function Home() {
  const { user } = useAuth()
  const greeting = user?.displayName ?? user?.email ?? null

  const [query, setQuery] = useState('')
  const filteredStacks = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return STACKS
    return STACKS.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q),
    )
  }, [query])

  return (
    <div className="relative">
      {/* Grid background — Swiss hero decoration */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[500px] bg-grid opacity-[0.35] [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)] dark:opacity-20"
        aria-hidden="true"
      />

      <div className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
        {/* Hero */}
        <section className="mx-auto mb-16 max-w-3xl space-y-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border bg-background/60 px-3 py-1 font-mono text-xs font-medium text-muted-foreground backdrop-blur">
            <span className="relative flex h-2 w-2" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[--success] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[--success]" />
            </span>
            <span>online · {TOTAL_LABS} labs · 4 stacks</span>
          </div>

          <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tighter sm:text-5xl lg:text-6xl">
            เรียน Backend ด้วยของจริง
            <br />
            <span className="text-muted-foreground">ไม่ใช่แค่อ่าน.</span>
          </h1>

          <p className="mx-auto max-w-xl text-base text-muted-foreground sm:text-lg">
            Docker, PostgreSQL, Redis, MongoDB — 65 labs ที่รันใน container จริง
            เขียนโค้ดจริง เก็บความคืบหน้าไว้ดูย้อนหลังได้ในเว็บเดียว
          </p>

          {/* Search bar — docs-landing pattern */}
          <div className="mx-auto max-w-md pt-2">
            <label htmlFor="lab-search" className="sr-only">
              ค้นหา labs
            </label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id="lab-search"
                type="search"
                placeholder="ค้นหา lab เช่น docker, index, pub/sub…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-11 pl-9 pr-3 font-mono text-sm"
              />
            </div>
          </div>

          {/* CTA row */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {!user && (
              <Button size="lg" asChild className="cursor-pointer">
                <Link to="/register">
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                  เริ่มเรียนฟรี
                </Link>
              </Button>
            )}
            <Button size="lg" variant="outline" asChild className="cursor-pointer">
              <a
                href="https://github.com/thammasornlueadtaharn/dev-labs"
                target="_blank"
                rel="noreferrer noopener"
              >
                <Terminal className="h-4 w-4" aria-hidden="true" />
                ดู labs บน GitHub
              </a>
            </Button>
          </div>

          {greeting && (
            <p className="pt-2 font-mono text-xs text-muted-foreground">
              // signed in as <span className="font-medium text-foreground">{greeting}</span>
            </p>
          )}
        </section>

        <Separator className="my-12" />

        {/* Stacks section */}
        <section>
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h2 className="font-display text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Learning paths
              </h2>
              <p className="mt-1 text-lg font-semibold text-foreground">
                เลือกหัวข้อที่สนใจ
              </p>
            </div>
            <p className="hidden font-mono text-xs text-muted-foreground sm:block">
              {filteredStacks.length} / {STACKS.length} stacks
            </p>
          </div>

          {filteredStacks.length === 0 ? (
            <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
              ไม่พบ stack ที่ตรงกับ "{query}" — ลองคำค้นอื่น
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {filteredStacks.map((stack) => (
                <StackCard key={stack.slug} stack={stack} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function StackCard({ stack }: { stack: Stack }) {
  const Icon = stack.icon
  const tint = TINT_STYLES[stack.tint]
  return (
    <Link
      to={`/${stack.slug}`}
      className="group cursor-pointer rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      aria-label={`เริ่มเรียน ${stack.name} — ${stack.labCount} labs`}
    >
      <Card className="h-full transition-all duration-200 hover:-translate-y-0.5 hover:border-foreground/30 hover:shadow-sm">
        <CardHeader className="pb-3">
          <div
            className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg ${tint.bg}`}
            aria-hidden="true"
          >
            <Icon className={`h-5 w-5 ${tint.icon}`} />
          </div>
          <CardTitle className="flex items-center justify-between font-display text-lg tracking-tight">
            {stack.name}
            <ArrowRight
              className="h-4 w-4 shrink-0 translate-x-0 text-muted-foreground opacity-0 transition-all duration-200 group-hover:translate-x-1 group-hover:opacity-100"
              aria-hidden="true"
            />
          </CardTitle>
          <CardDescription className="leading-snug">
            {stack.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="font-mono text-xs text-muted-foreground">
            {stack.labCount} labs
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
