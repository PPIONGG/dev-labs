import { useEffect, useState } from 'react'

/**
 * Fake terminal session — แสดงในหน้า hero เพื่อให้รู้สึก developer-focused
 * พิมพ์ทีละบรรทัดด้วย stagger delay สำหรับเอฟเฟกต์สมจริง
 */
const LINES = [
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
] as const

export function TerminalMock() {
  const [visibleLines, setVisibleLines] = useState(0)

  useEffect(() => {
    if (visibleLines >= LINES.length) return
    const t = setTimeout(() => setVisibleLines((n) => n + 1), 350)
    return () => clearTimeout(t)
  }, [visibleLines])

  return (
    <div className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-[0_8px_32px_-12px] shadow-foreground/10 ring-1 ring-border/50">
      {/* Title bar */}
      <div className="flex items-center gap-2 border-b border-border/70 bg-muted/50 px-4 py-2.5">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" aria-hidden="true" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/80" aria-hidden="true" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-500/80" aria-hidden="true" />
        </div>
        <span className="ml-2 font-mono text-xs text-muted-foreground">
          dev-labs · bash
        </span>
      </div>

      {/* Body */}
      <div className="min-h-[260px] bg-background/50 p-4 font-mono text-[13px] leading-relaxed">
        {LINES.slice(0, visibleLines).map((line, i) => (
          <div key={i} className="whitespace-pre">
            {line.type === 'prompt' && (
              <>
                <span className="text-[--success]">$</span>{' '}
                <span className="text-foreground">{line.text}</span>
              </>
            )}
            {line.type === 'stdout' && (
              <span className="text-muted-foreground">{line.text}</span>
            )}
            {line.type === 'output' && (
              <span className="text-foreground/85">{line.text}</span>
            )}
          </div>
        ))}
        {visibleLines < LINES.length && (
          <span className="inline-block h-4 w-1.5 animate-pulse bg-foreground/70 align-middle" />
        )}
      </div>
    </div>
  )
}
