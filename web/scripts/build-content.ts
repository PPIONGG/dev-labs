/**
 * Content pipeline — สแกน labs ใน ../docker, ../postgresql, ../redis, ../mongodb
 * แล้วสร้าง:
 *   - public/content/index.json — สารบัญ labs ทั้งหมด (สำหรับ sidebar + search)
 *   - public/content/labs/<stack>__<labKey>.md — copy markdown ไปไว้ใน public
 *
 * รัน: npm run build:content (predev / prebuild auto)
 */
import { mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(__dirname, '..', '..')
const OUT_DIR = resolve(__dirname, '..', 'public', 'content')
const OUT_LABS = resolve(OUT_DIR, 'labs')

const STACKS = ['docker', 'postgresql', 'redis', 'mongodb'] as const
type StackSlug = (typeof STACKS)[number]

interface Lab {
  /** "<stack>/<labKey>" — เช่น "docker/lab-01-what-is-docker" */
  slug: string
  stack: StackSlug
  /** folder name เท่านั้น เช่น "lab-01-what-is-docker" */
  labKey: string
  /** เลขเรียงที่ extract จาก lab-NN */
  order: number
  /** ชื่อแสดง — จาก H1 ใน README หรือ derive จาก labKey */
  title: string
  /** เนื้อหาแบบสั้น — บรรทัดแรกหลัง heading (ถ้ามี) */
  description?: string
  /** path ใน public/ ที่จะ fetch (e.g. "/content/labs/docker__lab-01-what-is-docker.md") */
  path: string
}

interface ContentIndex {
  generatedAt: string
  totalLabs: number
  stacks: {
    slug: StackSlug
    name: string
    description: string
    labs: Lab[]
  }[]
}

const STACK_META: Record<StackSlug, { name: string; description: string }> = {
  docker: { name: 'Docker', description: 'Container, Compose, Kubernetes, CI/CD' },
  postgresql: {
    name: 'PostgreSQL',
    description: 'SQL, Indexing, Transactions, Performance',
  },
  redis: { name: 'Redis', description: 'In-memory, Caching, Pub/Sub, Streams' },
  mongodb: { name: 'MongoDB', description: 'NoSQL, Schema design, Aggregation' },
}

/** Extract H1 (line starting with `# `) from markdown */
function extractTitle(md: string, fallback: string): string {
  const match = md.match(/^#\s+(.+)$/m)
  return match ? match[1].trim() : fallback
}

/** Extract paragraph after H1 — first non-empty line (max 200 chars) */
function extractDescription(md: string): string | undefined {
  const lines = md.split('\n')
  let foundH1 = false
  for (const line of lines) {
    if (!foundH1 && /^#\s+/.test(line)) {
      foundH1 = true
      continue
    }
    if (foundH1 && line.trim() && !line.startsWith('#') && !line.startsWith('>')) {
      return line.trim().slice(0, 200)
    }
  }
  return undefined
}

/** เลข lab จาก folder name `lab-NN-...` → number; fallback 999 */
function parseOrder(labKey: string): number {
  const m = labKey.match(/^lab-(\d+)/)
  return m ? Number(m[1]) : 999
}

/** กรอง folder ที่ขึ้นต้นด้วย `lab-` */
function listLabFolders(stackDir: string): string[] {
  if (!statSync(stackDir, { throwIfNoEntry: false })?.isDirectory()) return []
  return readdirSync(stackDir).filter((name) => {
    if (!name.startsWith('lab-')) return false
    const full = join(stackDir, name)
    return statSync(full).isDirectory()
  })
}

/** Sanitize stack/labKey เป็น filename safe ใน public */
function buildOutputPath(stack: string, labKey: string): { abs: string; rel: string } {
  const file = `${stack}__${labKey}.md`
  return {
    abs: join(OUT_LABS, file),
    rel: `/content/labs/${file}`,
  }
}

function main() {
  // Reset output (clean re-build)
  rmSync(OUT_DIR, { recursive: true, force: true })
  mkdirSync(OUT_LABS, { recursive: true })

  const index: ContentIndex = {
    generatedAt: new Date().toISOString(),
    totalLabs: 0,
    stacks: [],
  }

  for (const stack of STACKS) {
    const stackDir = join(REPO_ROOT, stack)
    const folders = listLabFolders(stackDir)

    const labs: Lab[] = folders
      .map((labKey): Lab | null => {
        const readme = join(stackDir, labKey, 'README.md')
        let md: string
        try {
          md = readFileSync(readme, 'utf-8')
        } catch {
          return null // skip ถ้าไม่มี README
        }

        const order = parseOrder(labKey)
        const fallbackTitle = labKey.replace(/^lab-\d+-/, '').replace(/-/g, ' ')
        const title = extractTitle(md, fallbackTitle)
        const description = extractDescription(md)
        const { abs, rel } = buildOutputPath(stack, labKey)

        // Copy markdown ไป public/
        writeFileSync(abs, md, 'utf-8')

        return {
          slug: `${stack}/${labKey}`,
          stack,
          labKey,
          order,
          title,
          description,
          path: rel,
        }
      })
      .filter((x): x is Lab => x !== null)
      .sort((a, b) => a.order - b.order)

    index.stacks.push({
      slug: stack,
      name: STACK_META[stack].name,
      description: STACK_META[stack].description,
      labs,
    })
    index.totalLabs += labs.length

    console.log(`✓ ${STACK_META[stack].name.padEnd(11)} ${labs.length} labs`)
  }

  writeFileSync(join(OUT_DIR, 'index.json'), JSON.stringify(index, null, 2), 'utf-8')
  console.log(`\n📦 Indexed ${index.totalLabs} labs → public/content/`)
}

main()
