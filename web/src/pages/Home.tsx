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
  Rocket,
  BookOpenCheck,
  Gauge,
  Languages,
  Boxes,
  Palette,
  GitBranch,
  CloudCog,
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
import { TerminalMock } from '@/components/TerminalMock'
import { useAuth } from '@/hooks/useAuth'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

interface Stack {
  slug: string
  name: string
  level: 'เริ่มต้น' | 'ปานกลาง' | 'ขั้นสูง'
  description: string
  labCount: number
  icon: LucideIcon
  tint: string
}

const STACKS: Stack[] = [
  {
    slug: 'docker',
    name: 'Docker',
    level: 'เริ่มต้น',
    description: 'Container, Compose, Kubernetes, CI/CD',
    labCount: 19,
    icon: Container,
    tint: 'sky',
  },
  {
    slug: 'postgresql',
    name: 'PostgreSQL',
    level: 'ปานกลาง',
    description: 'SQL, Indexing, Transactions, Performance',
    labCount: 17,
    icon: Database,
    tint: 'indigo',
  },
  {
    slug: 'redis',
    name: 'Redis',
    level: 'ปานกลาง',
    description: 'In-memory, Caching, Pub/Sub, Streams',
    labCount: 14,
    icon: Flame,
    tint: 'rose',
  },
  {
    slug: 'mongodb',
    name: 'MongoDB',
    level: 'ขั้นสูง',
    description: 'NoSQL, Schema design, Aggregation',
    labCount: 15,
    icon: Leaf,
    tint: 'emerald',
  },
]

const TINT: Record<string, { icon: string; bg: string; ring: string }> = {
  sky: {
    icon: 'text-sky-600 dark:text-sky-400',
    bg: 'bg-sky-500/10',
    ring: 'ring-sky-500/20',
  },
  indigo: {
    icon: 'text-indigo-600 dark:text-indigo-400',
    bg: 'bg-indigo-500/10',
    ring: 'ring-indigo-500/20',
  },
  rose: {
    icon: 'text-rose-600 dark:text-rose-400',
    bg: 'bg-rose-500/10',
    ring: 'ring-rose-500/20',
  },
  emerald: {
    icon: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-500/10',
    ring: 'ring-emerald-500/20',
  },
}

interface Feature {
  icon: LucideIcon
  title: string
  description: string
}

const FEATURES: Feature[] = [
  {
    icon: Boxes,
    title: 'Hands-on ล้วน',
    description:
      'ทุก lab รันใน Docker จริง — ไม่ต้องติดตั้ง DB ลงเครื่อง แค่ compose up ก็เริ่มได้',
  },
  {
    icon: Gauge,
    title: 'Progress tracking',
    description:
      'Login แล้วเรียน lab ไหนจบ เซฟอัตโนมัติ — กลับมาต่อที่เดิมได้ทุกเมื่อ',
  },
  {
    icon: Languages,
    title: 'ภาษาไทยเป็นหลัก',
    description:
      'README + คำอธิบายเป็นภาษาไทย ผสมศัพท์เทคนิค — เข้าใจง่ายกว่าเปิด docs อังกฤษ',
  },
  {
    icon: BookOpenCheck,
    title: 'แบ่ง Level ชัด',
    description:
      'แต่ละ stack มี level เริ่มต้น → ขั้นสูง พร้อม project สรุปท้ายบท',
  },
]

const STEPS = [
  {
    cmd: 'git clone dev-labs',
    title: 'Clone repo',
    description: 'ดึง labs ทั้งหมดมาไว้ในเครื่อง — 65 labs 4 stacks',
  },
  {
    cmd: 'docker compose up -d',
    title: 'รัน stack',
    description: 'Postgres + Redis + Mongo ทุกอย่างรันใน container',
  },
  {
    cmd: 'open lab-01/README.md',
    title: 'เริ่มเรียน',
    description: 'อ่าน concept → รันโค้ด → ทำโจทย์ → ติ๊ก Done',
  },
]

interface RoadmapItem {
  icon: LucideIcon
  title: string
  description: string
  status: 'available' | 'next' | 'planned'
  topics: string
}

const ROADMAP: RoadmapItem[] = [
  {
    icon: Database,
    title: 'Backend',
    description: 'Database, caching, containerization',
    status: 'available',
    topics: 'Docker · PostgreSQL · Redis · MongoDB',
  },
  {
    icon: Palette,
    title: 'Frontend',
    description: 'UI frameworks, styling, state management',
    status: 'next',
    topics: 'React · Tailwind · Component patterns',
  },
  {
    icon: GitBranch,
    title: 'Git & Collaboration',
    description: 'Version control + team workflow',
    status: 'next',
    topics: 'Branching · PR · Conflict resolution',
  },
  {
    icon: CloudCog,
    title: 'DevOps & Cloud',
    description: 'CI/CD, monitoring, deployment',
    status: 'planned',
    topics: 'GitHub Actions · Kubernetes · Observability',
  },
]

const TOTAL_LABS = STACKS.reduce((sum, s) => sum + s.labCount, 0)

export default function Home() {
  useDocumentTitle('Dev Labs · ฝึก Dev Skills ด้วยของจริง')
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
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[600px] bg-grid opacity-[0.35] [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)] dark:opacity-20"
        aria-hidden="true"
      />

      <div className="mx-auto max-w-6xl px-4 py-12 sm:py-20">
        {/* Hero */}
        <section className="mb-20 grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,480px)] lg:items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border bg-background/60 px-3 py-1 font-mono text-xs font-medium text-muted-foreground backdrop-blur">
              <span className="relative flex h-2 w-2" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[--success] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[--success]" />
              </span>
              <span>online · {TOTAL_LABS} labs · 4 stacks</span>
            </div>

            <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tighter sm:text-5xl lg:text-6xl">
              ฝึก Dev Skills
              <br />
              <span className="bg-gradient-to-br from-foreground to-foreground/50 bg-clip-text text-transparent">
                ด้วยของจริง.
              </span>
            </h1>

            <p className="max-w-xl text-base text-muted-foreground sm:text-lg">
              คลังฝึก developer แบบ hands-on — เริ่มจาก{' '}
              <span className="font-medium text-foreground">65 labs backend</span>{' '}
              (Docker, PostgreSQL, Redis, MongoDB) ที่รันใน container จริง
              <br className="hidden sm:block" />
              จะขยายไปทาง <span className="font-medium text-foreground">Frontend</span>,{' '}
              <span className="font-medium text-foreground">Git</span>,{' '}
              <span className="font-medium text-foreground">DevOps</span> ต่อไปเรื่อยๆ
            </p>

            {/* Search */}
            <div className="max-w-md">
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
                  placeholder="กรอง stacks เช่น docker, redis…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="h-11 pl-9 pr-3 font-mono text-sm"
                  aria-label="กรอง learning paths"
                />
              </div>
            </div>

            {/* CTA */}
            <div className="flex flex-wrap items-center gap-3">
              {!user && (
                <Button size="lg" asChild className="cursor-pointer">
                  <Link to="/register">
                    <Sparkles className="h-4 w-4" aria-hidden="true" />
                    เริ่มเรียนฟรี
                  </Link>
                </Button>
              )}
              <Button
                size="lg"
                variant="outline"
                className="cursor-pointer"
                onClick={() =>
                  document
                    .getElementById('roadmap')
                    ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }
              >
                <Terminal className="h-4 w-4" aria-hidden="true" />
                ดู roadmap
              </Button>
            </div>

            {greeting && (
              <p className="font-mono text-xs text-muted-foreground">
                // signed in as{' '}
                <span className="font-medium text-foreground">{greeting}</span>
              </p>
            )}
          </div>

          <div className="lg:sticky lg:top-24">
            <TerminalMock />
          </div>
        </section>

        {/* Stats strip */}
        <section
          aria-label="Statistics"
          className="mb-20 grid grid-cols-2 gap-6 rounded-xl border bg-muted/30 p-6 sm:grid-cols-4 sm:p-8"
        >
          {[
            { value: '65', label: 'labs' },
            { value: '4', label: 'stacks' },
            { value: '100%', label: 'hands-on' },
            { value: '0฿', label: 'ใช้ฟรี' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="font-display text-3xl font-bold tracking-tighter sm:text-4xl">
                {stat.value}
              </div>
              <div className="mt-1 font-mono text-xs uppercase tracking-widest text-muted-foreground">
                {stat.label}
              </div>
            </div>
          ))}
        </section>

        {/* Features section */}
        <section className="mb-20">
          <div className="mb-8 max-w-2xl">
            <div className="mb-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
              // why dev-labs
            </div>
            <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
              เรียนได้จริง ไม่ใช่ทฤษฎีลอยๆ
            </h2>
            <p className="mt-3 text-muted-foreground">
              แนวคิด + คำสั่งจริง + โจทย์จริง — พร้อมที่จะเริ่มโดยไม่ต้อง setup อะไรให้ยุ่ง
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => {
              const Icon = f.icon
              return (
                <div
                  key={f.title}
                  className="group rounded-xl border bg-card p-5 transition-colors hover:border-foreground/30"
                >
                  <div className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[--success]/10 ring-1 ring-[--success]/20">
                    <Icon
                      className="h-4.5 w-4.5 text-[--success]"
                      aria-hidden="true"
                    />
                  </div>
                  <h3 className="font-display text-base font-semibold">
                    {f.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {f.description}
                  </p>
                </div>
              )
            })}
          </div>
        </section>

        {/* How it works */}
        <section className="mb-20">
          <div className="mb-8 max-w-2xl">
            <div className="mb-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
              // how it works
            </div>
            <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
              3 ขั้นตอน เริ่มเรียนได้
            </h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <div key={step.title} className="relative">
                <div className="rounded-xl border bg-card p-6">
                  <div className="mb-4 inline-flex h-8 items-center rounded-full border bg-muted px-3 font-mono text-xs text-muted-foreground">
                    step {String(i + 1).padStart(2, '0')}
                  </div>
                  <div className="mb-4 rounded-lg bg-muted/60 p-3 font-mono text-xs ring-1 ring-border">
                    <span className="text-[--success]">$</span>{' '}
                    <span className="text-foreground">{step.cmd}</span>
                  </div>
                  <h3 className="font-display text-lg font-semibold tracking-tight">
                    {step.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <Separator className="my-12" />

        {/* Stacks */}
        <section>
          <div className="mb-6 flex items-end justify-between">
            <div>
              <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                // available now · backend
              </div>
              <h2 className="mt-1 font-display text-2xl font-bold tracking-tight sm:text-3xl">
                เลือกหัวข้อที่สนใจ
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                ตอนนี้มี 4 stacks พร้อมเรียน — คลิกเพื่อเข้าไปดู labs
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

        {/* Roadmap — honest about what's here now vs coming */}
        <section id="roadmap" className="mt-20 scroll-mt-20">
          <div className="mb-8 max-w-2xl">
            <div className="mb-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
              // roadmap
            </div>
            <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
              เป้าหมายระยะยาว: ครบทุกด้านของ dev
            </h2>
            <p className="mt-3 text-muted-foreground">
              Backend เริ่มก่อนเพราะจับต้องได้ง่าย รันใน container ได้ทันที —
              จากนั้นจะค่อยๆ เพิ่มส่วนอื่นๆ ที่ dev ควรรู้
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {ROADMAP.map((item, i) => {
              const Icon = item.icon
              return (
                <div
                  key={item.title}
                  className="relative flex flex-col rounded-xl border bg-card p-5"
                >
                  {/* Connector dot (visual rhythm, desktop only) */}
                  <div className="mb-4 flex items-center justify-between">
                    <div
                      className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ring-1 ${
                        item.status === 'available'
                          ? 'bg-[--success]/10 ring-[--success]/30'
                          : 'bg-muted ring-border'
                      }`}
                      aria-hidden="true"
                    >
                      <Icon
                        className={`h-4.5 w-4.5 ${
                          item.status === 'available'
                            ? 'text-[--success]'
                            : 'text-muted-foreground'
                        }`}
                      />
                    </div>
                    <StatusBadge status={item.status} />
                  </div>

                  <h3 className="font-display text-base font-semibold tracking-tight">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                  <p className="mt-4 border-t pt-3 font-mono text-[11px] text-muted-foreground">
                    {item.topics}
                  </p>

                  {/* Step index — subtle */}
                  <span
                    className="absolute right-4 top-4 font-mono text-[10px] tabular-nums text-muted-foreground/60"
                    aria-hidden="true"
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </div>
              )
            })}
          </div>
        </section>

        {/* Bottom CTA */}
        {!user && (
          <section className="mt-20 overflow-hidden rounded-2xl border bg-gradient-to-br from-card to-muted/30 p-8 text-center sm:p-12">
            <Rocket
              className="mx-auto mb-4 h-10 w-10 text-[--success]"
              aria-hidden="true"
            />
            <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
              พร้อมเริ่มเรียนแล้วหรือยัง?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              สร้างบัญชีฟรี เก็บความคืบหน้าและโน้ตส่วนตัวได้ทันที
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Button size="lg" asChild className="cursor-pointer">
                <Link to="/register">
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                  เริ่มเรียนฟรี
                </Link>
              </Button>
              <Button size="lg" variant="ghost" asChild className="cursor-pointer">
                <Link to="/login">มีบัญชีอยู่แล้ว</Link>
              </Button>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: RoadmapItem['status'] }) {
  const map = {
    available: {
      label: 'พร้อมใช้',
      className: 'bg-[--success]/10 text-[--success] ring-[--success]/30',
    },
    next: {
      label: 'เร็วๆ นี้',
      className: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 ring-amber-500/30',
    },
    planned: {
      label: 'วางแผนไว้',
      className: 'bg-muted text-muted-foreground ring-border',
    },
  } as const
  const { label, className } = map[status]
  return (
    <span
      className={`rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ring-1 ${className}`}
    >
      {label}
    </span>
  )
}

function StackCard({ stack }: { stack: Stack }) {
  const Icon = stack.icon
  const t = TINT[stack.tint]
  return (
    <Link
      to={`/${stack.slug}`}
      className="group cursor-pointer rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      aria-label={`เริ่มเรียน ${stack.name} — ${stack.labCount} labs`}
    >
      <Card className="h-full transition-all duration-200 hover:-translate-y-0.5 hover:border-foreground/30 hover:shadow-md">
        <CardHeader className="pb-3">
          <div className="mb-3 flex items-center justify-between">
            <div
              className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${t.bg} ring-1 ${t.ring}`}
              aria-hidden="true"
            >
              <Icon className={`h-5 w-5 ${t.icon}`} />
            </div>
            <span className="rounded-full border bg-background px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {stack.level}
            </span>
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
        <CardContent className="pt-0">
          <div className="flex items-center justify-between border-t pt-3 font-mono text-xs text-muted-foreground">
            <span>{stack.labCount} labs</span>
            <span className="text-[--success]">→ เริ่มเรียน</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
