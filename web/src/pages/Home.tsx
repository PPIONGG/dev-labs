import { Link } from 'react-router-dom'
import { Container, Database, Flame, Leaf, ArrowRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'

interface Stack {
  slug: string
  name: string
  description: string
  labCount: number
  icon: LucideIcon
  iconClass: string
  iconBg: string
}

const STACKS: Stack[] = [
  {
    slug: 'docker',
    name: 'Docker',
    description: 'Container, Compose, Kubernetes, CI/CD',
    labCount: 19,
    icon: Container,
    iconClass: 'text-sky-600 dark:text-sky-400',
    iconBg: 'bg-sky-500/10',
  },
  {
    slug: 'postgresql',
    name: 'PostgreSQL',
    description: 'SQL, Indexing, Transactions, Performance',
    labCount: 17,
    icon: Database,
    iconClass: 'text-indigo-600 dark:text-indigo-400',
    iconBg: 'bg-indigo-500/10',
  },
  {
    slug: 'redis',
    name: 'Redis',
    description: 'In-memory, Caching, Pub/Sub, Streams',
    labCount: 14,
    icon: Flame,
    iconClass: 'text-rose-600 dark:text-rose-400',
    iconBg: 'bg-rose-500/10',
  },
  {
    slug: 'mongodb',
    name: 'MongoDB',
    description: 'NoSQL, Schema design, Aggregation',
    labCount: 15,
    icon: Leaf,
    iconClass: 'text-emerald-600 dark:text-emerald-400',
    iconBg: 'bg-emerald-500/10',
  },
]

const TOTAL_LABS = STACKS.reduce((sum, s) => sum + s.labCount, 0)

export default function Home() {
  const { user } = useAuth()
  const greeting = user?.displayName ?? user?.email ?? null

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:py-20">
      {/* Hero */}
      <section className="mb-16 space-y-4 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          Online · {TOTAL_LABS} labs พร้อมเรียน
        </div>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          คลังฝึก Backend & DevOps
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
          เรียนรู้ Docker, PostgreSQL, Redis, MongoDB ผ่านโจทย์จริง —
          เขียนโค้ด รัน container จริง ทำความคืบหน้าเก็บไว้ดูภายหลัง
        </p>
        {greeting && (
          <p className="text-sm text-muted-foreground">
            สวัสดี <span className="font-medium text-foreground">{greeting}</span> 👋
          </p>
        )}
      </section>

      {/* Stack grid */}
      <section>
        <h2 className="mb-6 text-sm font-medium uppercase tracking-widest text-muted-foreground">
          เลือกหัวข้อที่สนใจ
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STACKS.map((stack) => (
            <StackCard key={stack.slug} stack={stack} />
          ))}
        </div>
      </section>
    </div>
  )
}

function StackCard({ stack }: { stack: Stack }) {
  const Icon = stack.icon
  return (
    <Link to={`/${stack.slug}`} className="group focus:outline-none">
      <Card className="h-full transition-all hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-md">
        <CardHeader>
          <div
            className={`mb-2 inline-flex h-10 w-10 items-center justify-center rounded-lg ${stack.iconBg}`}
          >
            <Icon className={`h-5 w-5 ${stack.iconClass}`} />
          </div>
          <CardTitle className="flex items-center justify-between text-lg">
            {stack.name}
            <ArrowRight className="h-4 w-4 translate-x-0 text-muted-foreground opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
          </CardTitle>
          <CardDescription>{stack.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-xs font-medium text-muted-foreground">
            {stack.labCount} labs
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
