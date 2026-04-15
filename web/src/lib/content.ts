/**
 * Lab content loader — index + per-lab markdown
 *
 * - Index loaded synchronously จาก `public/content/index.json` ตอน build
 * - Lab markdown fetch ตอน runtime (cached ใน Map)
 */

export interface Lab {
  slug: string // "docker/lab-01-what-is-docker"
  stack: StackSlug
  labKey: string // "lab-01-what-is-docker"
  order: number
  title: string
  description?: string
  path: string // "/content/labs/docker__lab-01-what-is-docker.md"
}

export type StackSlug = 'docker' | 'postgresql' | 'redis' | 'mongodb'

export interface StackInfo {
  slug: StackSlug
  name: string
  description: string
  labs: Lab[]
}

export interface ContentIndex {
  generatedAt: string
  totalLabs: number
  stacks: StackInfo[]
}

// -------------------- Index loader --------------------

let cachedIndex: ContentIndex | null = null
let indexPromise: Promise<ContentIndex> | null = null

/** โหลด index ของทุก labs (ทำครั้งเดียว) */
export async function loadContentIndex(): Promise<ContentIndex> {
  if (cachedIndex) return cachedIndex
  if (indexPromise) return indexPromise

  indexPromise = fetch('/content/index.json')
    .then((r) => {
      if (!r.ok) throw new Error(`Failed to load content index: ${r.status}`)
      return r.json() as Promise<ContentIndex>
    })
    .then((idx) => {
      cachedIndex = idx
      return idx
    })
    .catch((err) => {
      indexPromise = null
      throw err
    })

  return indexPromise
}

/** หา stack จาก slug — null ถ้าไม่พบ */
export function findStack(index: ContentIndex, slug: string): StackInfo | null {
  return index.stacks.find((s) => s.slug === slug) ?? null
}

/** หา lab จาก stack + labKey — null ถ้าไม่พบ */
export function findLab(
  index: ContentIndex,
  stackSlug: string,
  labKey: string,
): Lab | null {
  const stack = findStack(index, stackSlug)
  if (!stack) return null
  return stack.labs.find((l) => l.labKey === labKey) ?? null
}

/** หา lab ก่อนหน้า/ถัดไป ใน stack เดียวกัน — สำหรับ "Prev/Next" navigation */
export function findSiblings(
  index: ContentIndex,
  stackSlug: string,
  labKey: string,
): { prev: Lab | null; next: Lab | null } {
  const stack = findStack(index, stackSlug)
  if (!stack) return { prev: null, next: null }
  const i = stack.labs.findIndex((l) => l.labKey === labKey)
  if (i === -1) return { prev: null, next: null }
  return {
    prev: i > 0 ? stack.labs[i - 1] : null,
    next: i < stack.labs.length - 1 ? stack.labs[i + 1] : null,
  }
}

// -------------------- Lab markdown loader --------------------

const labCache = new Map<string, string>()

/** Fetch markdown ของ lab (cached) */
export async function loadLabMarkdown(path: string): Promise<string> {
  const cached = labCache.get(path)
  if (cached !== undefined) return cached

  const res = await fetch(path)
  if (!res.ok) throw new Error(`Failed to load lab: ${res.status}`)
  const md = await res.text()
  labCache.set(path, md)
  return md
}
