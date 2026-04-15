import { useEffect, useState } from 'react'
import { useReducedMotion } from '@/hooks/useReducedMotion'

/**
 * Fake terminal session — hero decoration
 *
 * หมุน scene ไปเรื่อย ๆ เพื่อไม่ให้ดูนิ่งหลังพิมพ์จบ:
 *   1. quickstart (docker compose + psql)
 *   2. PostgreSQL performance (EXPLAIN ANALYZE 60× faster)
 *   3. Redis caching (GET/SET + TTL + mutex lock)
 *   4. MongoDB aggregation ($facet)
 *
 * Flow: พิมพ์ทีละบรรทัด (350ms) → พอจบ scene รอ 2.5s → clear → next scene
 * เคารพ prefers-reduced-motion → แสดง scene 1 นิ่ง ไม่มี animation
 */

type LineType = 'prompt' | 'stdout' | 'output' | 'comment'
interface Line {
  type: LineType
  text: string
}
interface Scene {
  title: string
  lines: Line[]
}

const SCENES: Scene[] = [
  {
    title: 'dev-labs · quickstart',
    lines: [
      { type: 'prompt', text: 'docker compose up -d' },
      { type: 'stdout', text: '✓ Container postgres-dev  Started' },
      { type: 'stdout', text: '✓ Container redis-cache   Started' },
      { type: 'prompt', text: 'psql -U devlabs -d devlabs' },
      { type: 'stdout', text: 'devlabs=# SELECT * FROM labs LIMIT 3;' },
      { type: 'output', text: ' id | stack      | title' },
      { type: 'output', text: '----+------------+----------------------' },
      { type: 'output', text: '  1 | docker     | First container' },
      { type: 'output', text: '  2 | postgresql | CRUD operations' },
      { type: 'output', text: '  3 | redis      | Hit counter' },
      { type: 'stdout', text: '(3 rows)' },
    ],
  },
  {
    title: 'postgresql · lab-15-performance',
    lines: [
      { type: 'prompt', text: 'EXPLAIN ANALYZE SELECT * FROM users' },
      { type: 'prompt', text: '  WHERE email = $1;' },
      { type: 'comment', text: '-- ก่อน: ไม่มี index' },
      { type: 'output', text: 'Seq Scan on users' },
      { type: 'output', text: '  actual time=5.123..12.456 ms' },
      { type: 'output', text: '  Rows Removed by Filter: 99999' },
      { type: 'prompt', text: 'CREATE INDEX idx_users_email' },
      { type: 'prompt', text: '  ON users(email);' },
      { type: 'stdout', text: 'CREATE INDEX' },
      { type: 'comment', text: '-- หลัง: มี index' },
      { type: 'output', text: 'Index Scan using idx_users_email' },
      { type: 'output', text: '  actual time=0.035..0.210 ms' },
    ],
  },
  {
    title: 'redis · lab-13-caching',
    lines: [
      { type: 'prompt', text: 'redis-cli -h localhost' },
      { type: 'prompt', text: 'SET product:42 \'{"name":"mouse"}\' EX 300' },
      { type: 'output', text: 'OK' },
      { type: 'prompt', text: 'GET product:42' },
      { type: 'output', text: '"{\\"name\\":\\"mouse\\"}"' },
      { type: 'prompt', text: 'TTL product:42' },
      { type: 'output', text: '(integer) 298' },
      { type: 'comment', text: '-- mutex กัน cache stampede' },
      { type: 'prompt', text: 'SET lock:42 1 NX EX 10' },
      { type: 'output', text: 'OK' },
      { type: 'stdout', text: '# cache-aside + mutex พร้อมใช้' },
    ],
  },
  {
    title: 'mongodb · lab-08-aggregation',
    lines: [
      { type: 'prompt', text: 'db.sales.aggregate([' },
      { type: 'prompt', text: '  { $match: { year: 2026 } },' },
      { type: 'prompt', text: '  { $facet: {' },
      { type: 'prompt', text: '    top: [{ $group: ... }, { $sort: ... }],' },
      { type: 'prompt', text: '    trend: [{ $group: { _id: "$month" }}],' },
      { type: 'prompt', text: '    sum: [{ $group: { _id: null, ... }}]' },
      { type: 'prompt', text: '  }}' },
      { type: 'prompt', text: '])' },
      { type: 'output', text: '[{ top: [...5], trend: [...12], sum: [...1] }]' },
      { type: 'stdout', text: '# 3 reports ใน query เดียว' },
    ],
  },
]

const TYPE_MS = 350
const SCENE_PAUSE_MS = 2500

export function TerminalMock() {
  const reducedMotion = useReducedMotion()
  const [sceneIdx, setSceneIdx] = useState(0)
  const [visibleLines, setVisibleLines] = useState(
    reducedMotion ? SCENES[0].lines.length : 0,
  )
  const scene = SCENES[sceneIdx]
  const lineCount = scene.lines.length

  useEffect(() => {
    // reduced motion → โชว์ scene แรกเต็ม ๆ ไม่หมุน ไม่พิมพ์
    if (reducedMotion) return

    // ยังไม่จบ scene → พิมพ์บรรทัดถัดไป
    if (visibleLines < lineCount) {
      const t = setTimeout(() => setVisibleLines((n) => n + 1), TYPE_MS)
      return () => clearTimeout(t)
    }

    // จบ scene แล้ว → พัก แล้วไป scene ถัดไป
    const t = setTimeout(() => {
      setSceneIdx((i) => (i + 1) % SCENES.length)
      setVisibleLines(0)
    }, SCENE_PAUSE_MS)
    return () => clearTimeout(t)
  }, [visibleLines, lineCount, reducedMotion])

  return (
    <div className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-[0_8px_32px_-12px] shadow-foreground/10 ring-1 ring-border/50">
      {/* Title bar */}
      <div className="flex items-center gap-2 border-b border-border/70 bg-muted/50 px-4 py-2.5">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" aria-hidden="true" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/80" aria-hidden="true" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-500/80" aria-hidden="true" />
        </div>
        <span
          key={scene.title}
          className="ml-2 font-mono text-xs text-muted-foreground animate-in fade-in duration-300"
        >
          {scene.title}
        </span>
      </div>

      {/* Body — คงความสูงให้ไม่กระตุก ตอน scene เปลี่ยน */}
      <div className="min-h-[340px] bg-background/50 p-4 font-mono text-[13px] leading-relaxed">
        {scene.lines.slice(0, visibleLines).map((line, i) => (
          <div key={`${sceneIdx}-${i}`} className="whitespace-pre">
            {line.type === 'prompt' && (
              <>
                <span className="text-(--success)">$</span>{' '}
                <span className="text-foreground">{line.text}</span>
              </>
            )}
            {line.type === 'stdout' && (
              <span className="text-muted-foreground">{line.text}</span>
            )}
            {line.type === 'output' && (
              <span className="text-foreground/85">{line.text}</span>
            )}
            {line.type === 'comment' && (
              <span className="text-muted-foreground/70 italic">{line.text}</span>
            )}
          </div>
        ))}
        {/* Blinking cursor ขณะพิมพ์ */}
        {!reducedMotion && visibleLines < lineCount && (
          <span className="inline-block h-4 w-1.5 animate-pulse bg-foreground/70 align-middle" />
        )}
      </div>
    </div>
  )
}
