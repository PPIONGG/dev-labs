import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import hljs from 'highlight.js/lib/core'
import dockerfile from 'highlight.js/lib/languages/dockerfile'
import javascript from 'highlight.js/lib/languages/javascript'
import sql from 'highlight.js/lib/languages/sql'
import 'highlight.js/styles/github-dark.css'
import { ArrowRight, Rocket, Sparkles, Zap } from 'lucide-react'

// ลงทะเบียน language เฉพาะที่ code tabs ใช้ (บันเดิลเล็กกว่า full hljs)
hljs.registerLanguage('dockerfile', dockerfile)
hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('sql', sql)
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TerminalMock } from '@/components/TerminalMock'
import { Reveal } from '@/components/Reveal'
import { SpotlightCard } from '@/components/SpotlightCard'
import { useAuth } from '@/hooks/useAuth'
import { useContentIndex } from '@/hooks/useContent'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useInView } from '@/hooks/useInView'
import { useCountUp } from '@/hooks/useCountUp'
import { STACKS, TINT, type StackMeta, type StackSlug } from '@/lib/stacks'
import { cn } from '@/lib/utils'

// -------------------- Section data --------------------

/**
 * Concrete outcomes ต่อ stack — เนื้อหาจริงที่ labs สอน ไม่ใช่ description ทั่วไป
 * ถ้าแก้ลำดับ lab หรือเพิ่ม lab — ปรับ flagship + outcomes ให้สัมพันธ์กัน
 */
interface StackOutcome {
  slug: StackSlug
  outcomes: string[]
  /** lab slug (ไม่มี stack prefix) ของ lab เด่น — link ไปหน้า lab */
  flagshipLabKey: string
}

const STACK_OUTCOMES: StackOutcome[] = [
  {
    slug: 'docker',
    outcomes: [
      'ลดขนาด image 1GB → 150MB ด้วย multi-stage build',
      'รัน fullstack (Node + Postgres + Redis) ด้วย Compose',
      'Deploy ขึ้น Kubernetes จริง + CI/CD ด้วย GitHub Actions',
    ],
    flagshipLabKey: 'lab-12-multistage-builds',
  },
  {
    slug: 'postgresql',
    outcomes: [
      'อ่าน EXPLAIN ANALYZE → ทำ query 5s → 30ms (50× เร็วขึ้น)',
      'ออกแบบ composite/partial index ให้ตรงกับ query pattern',
      'Transaction isolation ป้องกัน dirty read ในงานจริง',
    ],
    flagshipLabKey: 'lab-15-performance',
  },
  {
    slug: 'redis',
    outcomes: [
      'Cache-aside + mutex กัน cache stampede',
      'Realtime chat ด้วย Pub/Sub + Streams consumer groups',
      'LUA scripts ทำ atomic multi-command โดยไม่ต้อง lock',
    ],
    flagshipLabKey: 'lab-13-caching-patterns',
  },
  {
    slug: 'mongodb',
    outcomes: [
      '$facet + $lookup ออก analytics หลายมิติใน query เดียว',
      'Aggregation pipeline + schema validation',
      'Transactions + Change streams sync หลายคอลเล็กชัน',
    ],
    flagshipLabKey: 'lab-08-aggregation',
  },
]

/** Signature skills list — คัดหัวข้อที่ dev ไทย "หาคู่สอนยาก" */
const SIGNATURE_SKILLS: string[] = [
  'อ่านและแปลผล EXPLAIN ANALYZE ของ PostgreSQL',
  'ออกแบบ composite index (ทำไม (a,b) ใช้กับ WHERE b ไม่ได้)',
  'ป้องกัน cache stampede ด้วย mutex lock บน Redis',
  'LUA scripts สำหรับ atomic operations ใน Redis',
  'MongoDB $facet + $lookup — analytics ใน query เดียว',
  'Multi-stage Dockerfile + layer caching ที่ใช้จริง',
  'Docker healthcheck orchestration (depends_on condition)',
  'Deploy Kubernetes + rolling update + rollback',
]

/**
 * Code samples จาก flagship lab จริง — แสดงใน tabs section
 * hljs class ใช้ syntax highlight (rehype-highlight inject CSS จาก github-dark.css)
 */
interface CodeTab {
  slug: StackSlug
  label: string
  /** lang class สำหรับ highlight.js เช่น 'language-sql' */
  lang: string
  /** ชื่อไฟล์/ที่มา — แสดงเป็น caption */
  source: string
  /** Code body (trimmed) */
  code: string
  /** ข้อความ 1 บรรทัดอธิบายว่า snippet นี้สอนอะไร */
  caption: string
}

const CODE_TABS: CodeTab[] = [
  {
    slug: 'docker',
    label: 'Docker',
    lang: 'language-dockerfile',
    source: 'docker/lab-12-multistage-builds',
    caption: 'Multi-stage build — ลด image 1GB → 150MB ด้วย Alpine + prod deps',
    code: `# Stage 1: Build
FROM node:20 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Production (prod-only deps)
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
CMD ["node", "dist/index.js"]`,
  },
  {
    slug: 'postgresql',
    label: 'PostgreSQL',
    lang: 'language-sql',
    source: 'postgresql/lab-15-performance',
    caption: 'EXPLAIN ANALYZE — ก่อน/หลังมี index: 12.5ms → 0.2ms (60× เร็ว)',
    code: `-- ก่อน: Seq Scan เกือบ 100k rows
EXPLAIN ANALYZE
SELECT * FROM customers WHERE city = 'Bangkok';
-- Seq Scan (actual time=5.123..12.456 ms)
--   Rows Removed by Filter: 99999

-- สร้าง index
CREATE INDEX idx_customers_city ON customers(city);

-- หลัง: Index Scan
EXPLAIN ANALYZE
SELECT * FROM customers WHERE city = 'Bangkok';
-- Index Scan using idx_customers_city
--   (actual time=0.035..0.210 ms)`,
  },
  {
    slug: 'redis',
    label: 'Redis',
    lang: 'language-javascript',
    source: 'redis/lab-13-caching-patterns',
    caption: 'Cache-aside + mutex lock — กัน cache stampede ตอนหลาย request ชน',
    code: `async function getProduct(id) {
  const cached = await redis.get(\`product:\${id}\`)
  if (cached) return JSON.parse(cached)

  // ลองจับ lock — NX = สร้างได้ถ้ายังไม่มี, EX = หมดอายุใน 10s
  const locked = await redis.set(
    \`lock:product:\${id}\`, '1', 'NX', 'EX', 10
  )
  if (!locked) {
    await sleep(50)
    return getProduct(id)  // retry
  }

  try {
    const fresh = await db.product.findUnique({ where: { id } })
    await redis.set(\`product:\${id}\`, JSON.stringify(fresh), 'EX', 300)
    return fresh
  } finally {
    await redis.del(\`lock:product:\${id}\`)
  }
}`,
  },
  {
    slug: 'mongodb',
    label: 'MongoDB',
    lang: 'language-javascript',
    source: 'mongodb/lab-08-aggregation',
    caption: '$facet — ดึง top categories + monthly trend + summary ใน query เดียว',
    code: `db.sales.aggregate([
  { $match: { date: { $gte: new Date('2026-01-01') } } },
  {
    $facet: {
      topCategories: [
        { $group: { _id: '$category', total: { $sum: '$total' } } },
        { $sort: { total: -1 } },
        { $limit: 5 },
      ],
      monthlyTrend: [
        { $group: { _id: { $month: '$date' }, revenue: { $sum: '$total' } } },
        { $sort: { _id: 1 } },
      ],
      summary: [
        { $group: { _id: null, total: { $sum: '$total' }, avg: { $avg: '$total' } } },
      ],
    },
  },
])`,
  },
]

// -------------------- Page --------------------

export default function Home() {
  useDocumentTitle('Dev Labs · ฝึก dev skills ด้วยของจริง')
  const { user } = useAuth()
  const { data: index } = useContentIndex()

  // ดึง lab count ต่อ stack จาก index (single source of truth)
  const labCountMap = useMemo<Record<string, number>>(() => {
    if (!index) return {}
    return Object.fromEntries(index.stacks.map((s) => [s.slug, s.labs.length]))
  }, [index])
  const totalLabs = index?.totalLabs ?? 0

  return (
    <div className="relative">
      {/* Grid background — Swiss hero decoration */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[600px] bg-grid opacity-[0.35] [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)] dark:opacity-20"
        aria-hidden="true"
      />

      <div className="mx-auto max-w-6xl px-4 py-12 sm:py-20">
        {/* Section 1 — Hero */}
        <HeroSection user={user} totalLabs={totalLabs} />

        {/* Section 2 — Outcomes per stack */}
        <Reveal as="section" id="outcomes" className="mt-24 scroll-mt-20">
          <SectionHeader
            tag="// what you'll actually do"
            title="เรียนจบแต่ละ stack แล้วทำอะไรได้?"
            subtitle="ไม่ใช่ “เข้าใจ Docker” แต่ “ลด image 5 เท่า + Deploy K8s ได้เอง” — concrete outcomes จริงจาก labs"
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {STACK_OUTCOMES.map((item, i) => (
              <Reveal key={item.slug} delay={i * 80}>
                <OutcomeCard
                  item={item}
                  labCount={labCountMap[item.slug] ?? 0}
                />
              </Reveal>
            ))}
          </div>
        </Reveal>

        {/* Section 3 — Code tabs */}
        <Reveal as="section" id="code-preview" className="mt-24 scroll-mt-20">
          <SectionHeader
            tag="// see the labs"
            title="ตัวอย่างของจริงจาก labs"
            subtitle="โค้ดที่ copy ไปใช้งานได้เลย — ไม่ใช่ pseudocode"
          />
          <div className="mt-8">
            <CodeTabs tabs={CODE_TABS} />
          </div>
        </Reveal>

        {/* Section 4 — Signature skills */}
        <Reveal as="section" className="mt-24">
          <SectionHeader
            tag="// signature skills"
            title="สิ่งที่หาคู่สอนยากในไทย"
            subtitle="หัวข้อที่ส่วนมากไปเจอในบทความอังกฤษหรือ StackOverflow — เรารวมมาไว้ที่เดียว"
          />
          <ul className="mt-8 grid gap-2 sm:grid-cols-2">
            {SIGNATURE_SKILLS.map((skill) => (
              <li
                key={skill}
                className="flex items-start gap-3 rounded-lg border bg-card/50 px-4 py-3 text-sm"
              >
                <Zap
                  className="mt-0.5 h-4 w-4 shrink-0 text-(--success)"
                  aria-hidden="true"
                />
                <span className="leading-snug">{skill}</span>
              </li>
            ))}
          </ul>
        </Reveal>

        {/* Section 5 — Bottom CTA */}
        <BottomCTA user={user} totalLabs={totalLabs} />
      </div>
    </div>
  )
}

// -------------------- Hero --------------------

function HeroSection({
  user,
  totalLabs,
}: {
  user: ReturnType<typeof useAuth>['user']
  totalLabs: number
}) {
  const greeting = user?.displayName ?? user?.email ?? null
  const projectLabs = 13 // 4+3+3+3 — คงที่ตาม content
  return (
    <section className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,480px)] lg:items-center">
      <div className="space-y-6">
        <div className="inline-flex items-center gap-2 rounded-full border bg-background/60 px-3 py-1 font-mono text-xs font-medium text-muted-foreground backdrop-blur">
          <span className="relative flex h-2 w-2" aria-hidden="true">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-(--success) opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-(--success)" />
          </span>
          <span>
            online · {totalLabs || '—'} labs · {projectLabs} projects · ฟรี
          </span>
        </div>

        <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tighter sm:text-5xl lg:text-6xl">
          ฝึก dev skills
          <br />
          <span className="bg-gradient-to-br from-foreground to-foreground/50 bg-clip-text text-transparent">
            ด้วยของจริง.
          </span>
        </h1>

        <p className="max-w-xl text-base text-muted-foreground sm:text-lg">
          คลังฝึกแบบ hands-on สำหรับ{' '}
          <span className="font-medium text-foreground">Docker</span>,{' '}
          <span className="font-medium text-foreground">PostgreSQL</span>,{' '}
          <span className="font-medium text-foreground">Redis</span>,{' '}
          <span className="font-medium text-foreground">MongoDB</span> —
          ทุก lab รันใน container ได้ทันที พร้อมโจทย์ท้ายบทและเฉลย
          <br className="hidden sm:block" />
          เรียนจบแล้ว<span className="font-medium text-foreground">ใช้งานจริงได้</span> ไม่ใช่ทฤษฎีลอย ๆ
        </p>

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
            variant={user ? 'default' : 'outline'}
            asChild
            className="cursor-pointer"
          >
            <a href="#outcomes">
              ดูเนื้อหา
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
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
  )
}

// -------------------- Section helpers --------------------

function SectionHeader({
  tag,
  title,
  subtitle,
}: {
  tag: string
  title: string
  subtitle: string
}) {
  return (
    <div className="max-w-2xl">
      <div className="mb-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
        {tag}
      </div>
      <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
        {title}
      </h2>
      <p className="mt-3 text-muted-foreground">{subtitle}</p>
    </div>
  )
}

// -------------------- Outcome card --------------------

function OutcomeCard({
  item,
  labCount,
}: {
  item: StackOutcome
  labCount: number
}) {
  const meta = STACKS.find((s) => s.slug === item.slug) as StackMeta
  const Icon = meta.icon
  const tint = TINT[meta.tint]
  return (
    <SpotlightCard className="h-full">
      <Card className="h-full bg-transparent transition-all duration-200 hover:border-foreground/30 hover:shadow-xs">
        <CardHeader className="pb-3">
          <div className="mb-3 flex items-center justify-between">
            <div
              className={cn(
                'inline-flex h-10 w-10 items-center justify-center rounded-lg ring-1',
                tint.bg,
                tint.ring,
              )}
              aria-hidden="true"
            >
              <Icon className={cn('h-5 w-5', tint.icon)} />
            </div>
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              {labCount} labs · {meta.level}
            </span>
          </div>
          <CardTitle className="font-display text-lg tracking-tight">
            {meta.name}
          </CardTitle>
          <CardDescription className="leading-snug">
            {meta.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 pt-0">
          <ul className="space-y-2 text-sm">
            {item.outcomes.map((o) => (
              <li key={o} className="flex items-start gap-2 leading-snug">
                <span
                  className={cn('mt-1.5 h-1 w-1 shrink-0 rounded-full', tint.icon, 'bg-current')}
                  aria-hidden="true"
                />
                <span>{o}</span>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between border-t pt-3 font-mono text-xs">
            <Link
              to={`/${meta.slug}/${item.flagshipLabKey}`}
              className="cursor-pointer text-muted-foreground transition-colors hover:text-foreground"
            >
              flagship: {item.flagshipLabKey} →
            </Link>
            <Link
              to={`/${meta.slug}`}
              className="cursor-pointer text-(--success) transition-colors hover:brightness-110"
            >
              ดู labs →
            </Link>
          </div>
        </CardContent>
      </Card>
    </SpotlightCard>
  )
}

// -------------------- Code tabs --------------------

function CodeTabs({ tabs }: { tabs: CodeTab[] }) {
  const [activeSlug, setActiveSlug] = useState<StackSlug>(tabs[0].slug)
  const active = tabs.find((t) => t.slug === activeSlug) ?? tabs[0]
  const meta = STACKS.find((s) => s.slug === active.slug) as StackMeta
  const tint = TINT[meta.tint]
  const codeRef = useRef<HTMLElement | null>(null)

  // Re-run syntax highlight เมื่อ tab เปลี่ยน
  // (ต้อง clear data-highlighted flag ของ hljs ก่อน ไม่งั้นไม่ highlight ซ้ำ)
  useEffect(() => {
    const el = codeRef.current
    if (!el) return
    el.removeAttribute('data-highlighted')
    hljs.highlightElement(el)
  }, [activeSlug])

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      {/* Tab list */}
      <div
        role="tablist"
        aria-label="ตัวอย่าง code จาก labs"
        className="flex overflow-x-auto border-b bg-muted/30"
      >
        {tabs.map((tab) => {
          const isActive = tab.slug === activeSlug
          const tabMeta = STACKS.find((s) => s.slug === tab.slug) as StackMeta
          const TabIcon = tabMeta.icon
          const tabTint = TINT[tabMeta.tint]
          return (
            <button
              key={tab.slug}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`tabpanel-${tab.slug}`}
              id={`tab-${tab.slug}`}
              onClick={() => setActiveSlug(tab.slug)}
              className={cn(
                'group relative flex shrink-0 cursor-pointer items-center gap-2 px-4 py-3 font-mono text-xs transition-colors',
                isActive
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
              )}
            >
              <TabIcon className={cn('h-3.5 w-3.5', tabTint.icon)} aria-hidden="true" />
              <span className="uppercase tracking-widest">{tab.label}</span>
              {isActive && (
                <span
                  className="absolute inset-x-2 -bottom-px h-px bg-foreground"
                  aria-hidden="true"
                />
              )}
            </button>
          )
        })}
      </div>

      {/* Caption */}
      <div className="flex items-center gap-3 border-b px-5 py-2.5 font-mono text-[11px] text-muted-foreground">
        <span className={cn('inline-block h-1.5 w-1.5 rounded-full', tint.icon, 'bg-current')} aria-hidden="true" />
        <span className="truncate">{active.caption}</span>
      </div>

      {/* Code panel */}
      <div
        role="tabpanel"
        id={`tabpanel-${active.slug}`}
        aria-labelledby={`tab-${active.slug}`}
      >
        <pre className="overflow-x-auto bg-[oklch(0.16_0.015_250)] p-5 text-[13px] leading-relaxed">
          <code ref={codeRef} className={active.lang}>
            {active.code}
          </code>
        </pre>
        <div className="flex items-center justify-between border-t px-5 py-3 font-mono text-[11px] text-muted-foreground">
          <span className="truncate">// {active.source}/README.md</span>
          <Link
            to={`/${active.source}`}
            className="cursor-pointer text-(--success) transition-colors hover:brightness-110"
          >
            อ่าน lab เต็ม →
          </Link>
        </div>
      </div>
    </div>
  )
}

// -------------------- Bottom CTA --------------------

function BottomCTA({
  user,
  totalLabs,
}: {
  user: ReturnType<typeof useAuth>['user']
  totalLabs: number
}) {
  return (
    <Reveal
      as="section"
      className="mt-24 overflow-hidden rounded-2xl border bg-gradient-to-br from-card to-muted/30 p-8 text-center sm:p-12"
    >
      <Rocket className="mx-auto mb-4 h-10 w-10 text-(--success)" aria-hidden="true" />

      <CountBadge totalLabs={totalLabs} />

      <h2 className="mt-6 font-display text-2xl font-bold tracking-tight sm:text-3xl">
        พร้อมเริ่มเรียนแล้วหรือยัง?
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
        สร้างบัญชีฟรี บันทึกความคืบหน้าอัตโนมัติ — หรือเปิด labs ดูโดยไม่ต้องสมัคร
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {!user ? (
          <>
            <Button size="lg" asChild className="cursor-pointer">
              <Link to="/register">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                เริ่มเรียนฟรี
              </Link>
            </Button>
            <Button size="lg" variant="ghost" asChild className="cursor-pointer">
              <Link to="/docker">ไปดู labs เลย</Link>
            </Button>
          </>
        ) : (
          <Button size="lg" asChild className="cursor-pointer">
            <Link to="/docker">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              ไปต่อที่ labs
            </Link>
          </Button>
        )}
      </div>
    </Reveal>
  )
}

/** Animated count badge — show ตอนเข้า viewport */
function CountBadge({ totalLabs }: { totalLabs: number }) {
  const [ref, inView] = useInView<HTMLDivElement>()
  const labs = useCountUp({ start: inView, end: totalLabs, duration: 1200 })
  const projects = useCountUp({ start: inView, end: 13, duration: 1000 })
  const hours = useCountUp({ start: inView, end: 65, duration: 1300 })
  return (
    <div
      ref={ref}
      className="inline-flex flex-wrap items-center justify-center gap-x-4 gap-y-2 rounded-full border bg-background/60 px-4 py-2 font-mono text-xs text-muted-foreground backdrop-blur"
    >
      <span>
        <span className="font-semibold text-foreground">{labs}</span> labs
      </span>
      <span className="text-border">·</span>
      <span>
        <span className="font-semibold text-foreground">{projects}</span> project labs
      </span>
      <span className="text-border">·</span>
      <span>
        ~<span className="font-semibold text-foreground">{hours}</span> ชั่วโมง
      </span>
      <span className="text-border">·</span>
      <span className="text-(--success)">ฟรี 100%</span>
    </div>
  )
}
