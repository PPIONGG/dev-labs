/**
 * Stack metadata — single source of truth
 *
 * รวมทุกอย่างที่เกี่ยวกับ stack ไว้ที่นี่:
 *   - slug / name / level / description
 *   - icon (lucide)
 *   - tint key + Tailwind classes สำหรับสี icon/bg/ring
 *
 * ถ้าจะเพิ่ม stack ใหม่ → แก้ที่นี่ที่เดียว + เพิ่ม folder labs + อัปเดต `LAB_SLUG_PATTERN` ใน api
 */
import {
  Container,
  Database,
  Flame,
  Leaf,
  type LucideIcon,
} from 'lucide-react'

export const STACK_SLUGS = ['docker', 'postgresql', 'redis', 'mongodb'] as const

export type StackSlug = (typeof STACK_SLUGS)[number]

export type StackLevel = 'เริ่มต้น' | 'ปานกลาง' | 'ขั้นสูง'

export type TintKey = 'sky' | 'indigo' | 'rose' | 'emerald'

export interface StackMeta {
  slug: StackSlug
  name: string
  level: StackLevel
  description: string
  icon: LucideIcon
  tint: TintKey
}

export const STACKS: readonly StackMeta[] = [
  {
    slug: 'docker',
    name: 'Docker',
    level: 'เริ่มต้น',
    description: 'Container, Compose, Kubernetes, CI/CD',
    icon: Container,
    tint: 'sky',
  },
  {
    slug: 'postgresql',
    name: 'PostgreSQL',
    level: 'ปานกลาง',
    description: 'SQL, Indexing, Transactions, Performance',
    icon: Database,
    tint: 'indigo',
  },
  {
    slug: 'redis',
    name: 'Redis',
    level: 'ปานกลาง',
    description: 'In-memory, Caching, Pub/Sub, Streams',
    icon: Flame,
    tint: 'rose',
  },
  {
    slug: 'mongodb',
    name: 'MongoDB',
    level: 'ขั้นสูง',
    description: 'NoSQL, Schema design, Aggregation',
    icon: Leaf,
    tint: 'emerald',
  },
]

/** Tailwind classes สำหรับ icon/bg/ring ของแต่ละ tint */
export interface TintClasses {
  icon: string
  bg: string
  ring: string
}

export const TINT: Record<TintKey, TintClasses> = {
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

/** Type guard — ใช้ validate `:stack` param ใน route */
export function isStackSlug(value: string): value is StackSlug {
  return (STACK_SLUGS as readonly string[]).includes(value)
}

/** หา metadata จาก slug — null ถ้าไม่พบ */
export function findStackMeta(slug: string): StackMeta | null {
  return STACKS.find((s) => s.slug === slug) ?? null
}
