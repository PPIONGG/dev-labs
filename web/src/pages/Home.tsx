import { Link } from 'react-router-dom'
import { Container, Database, Flame, Leaf } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

/**
 * หน้าแรก — hero + 4 stack cards (ทั้ง 4 stack page ยังเป็น placeholder)
 */
const STACKS = [
  {
    slug: 'docker',
    name: 'Docker',
    description: 'Container, Compose, K8s — 19 labs',
    icon: Container,
    color: 'text-sky-600 dark:text-sky-400',
    bg: 'bg-sky-50 dark:bg-sky-950/40',
  },
  {
    slug: 'postgresql',
    name: 'PostgreSQL',
    description: 'SQL, Indexing, Performance — 17 labs',
    icon: Database,
    color: 'text-indigo-600 dark:text-indigo-400',
    bg: 'bg-indigo-50 dark:bg-indigo-950/40',
  },
  {
    slug: 'redis',
    name: 'Redis',
    description: 'In-memory, Caching, Streams — 14 labs',
    icon: Flame,
    color: 'text-rose-600 dark:text-rose-400',
    bg: 'bg-rose-50 dark:bg-rose-950/40',
  },
  {
    slug: 'mongodb',
    name: 'MongoDB',
    description: 'NoSQL, Aggregation, Sharding — 15 labs',
    icon: Leaf,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
  },
] as const

export default function Home() {
  const { user } = useAuth()
  const greeting = user?.displayName ?? user?.email ?? null

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <section className="mb-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-[--color-foreground] sm:text-5xl">
          Dev Labs
        </h1>
        <p className="mt-3 text-lg text-[--color-muted-foreground]">
          คลังฝึกสำหรับ Backend & DevOps — 65 labs ครอบคลุม 4 stacks
        </p>
        {greeting && (
          <p className="mt-4 text-sm text-[--color-muted-foreground]">
            สวัสดี <span className="font-medium text-[--color-foreground]">{greeting}</span> 👋
          </p>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-[--color-muted-foreground]">
          เลือกหัวข้อที่สนใจ
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STACKS.map((stack) => {
            const Icon = stack.icon
            return (
              <Link
                key={stack.slug}
                to={`/${stack.slug}`}
                className="group rounded-lg border border-[--color-border] bg-[--color-card] p-5 transition-colors hover:border-[--color-accent]/60 hover:bg-[--color-muted]/50"
              >
                <div
                  className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-md ${stack.bg}`}
                >
                  <Icon className={`h-5 w-5 ${stack.color}`} />
                </div>
                <h3 className="text-lg font-semibold text-[--color-foreground]">
                  {stack.name}
                </h3>
                <p className="mt-1 text-sm text-[--color-muted-foreground]">
                  {stack.description}
                </p>
                <p className="mt-3 text-xs font-medium text-[--color-accent]">
                  เริ่มเรียน →
                </p>
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}
