import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { ChevronRight, CheckCircle2 } from 'lucide-react'
import { useProgress } from '@/components/ProgressProvider'
import type { ContentIndex } from '@/lib/content'
import { findStackMeta, TINT, type StackSlug } from '@/lib/stacks'
import { cn } from '@/lib/utils'

interface Props {
  index: ContentIndex
  /** stack ที่ active (จะ expand อัตโนมัติ) */
  currentStack?: StackSlug
  /** lab ที่กำลังอ่านอยู่ (highlight) */
  currentLabKey?: string
  /** เรียกตอนคลิกลิงก์ใน mobile drawer (เพื่อปิด drawer) */
  onNavigate?: () => void
}

/**
 * Sidebar — แสดง stacks + labs (collapsible groups)
 * - Stack ปัจจุบัน auto-expand
 * - คลิก stack header เพื่อ toggle
 * - Active state = NavLink isActive
 */
export function StackSidebar({
  index,
  currentStack,
  currentLabKey,
  onNavigate,
}: Props) {
  const { isDone } = useProgress()

  // Track open state per stack — เริ่มต้น expand stack ปัจจุบัน
  const [openMap, setOpenMap] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {}
    for (const s of index.stacks) {
      map[s.slug] = s.slug === currentStack
    }
    return map
  })

  const toggle = (slug: string) =>
    setOpenMap((m) => ({ ...m, [slug]: !m[slug] }))

  return (
    <nav className="flex flex-col gap-1 py-4" aria-label="Lab navigation">
      {index.stacks.map((stack) => {
        const meta = findStackMeta(stack.slug)
        const Icon = meta?.icon
        const tintClass = meta ? TINT[meta.tint].icon : ''
        const isOpen = openMap[stack.slug]
        const isCurrent = stack.slug === currentStack
        const doneCount = stack.labs.filter((l) => isDone(l.slug)).length

        return (
          <div key={stack.slug} className="px-2">
            {/* Stack header — toggle button */}
            <button
              type="button"
              onClick={() => toggle(stack.slug)}
              className={cn(
                'group flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors',
                isCurrent
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
              )}
              aria-expanded={isOpen}
              aria-controls={`stack-${stack.slug}-labs`}
            >
              <ChevronRight
                className={cn(
                  'h-3 w-3 shrink-0 text-muted-foreground transition-transform duration-200',
                  isOpen && 'rotate-90',
                )}
                aria-hidden="true"
              />
              {Icon && (
                <Icon
                  className={cn('h-3.5 w-3.5 shrink-0', tintClass)}
                  aria-hidden="true"
                />
              )}
              <span className="font-mono text-xs uppercase tracking-wider">
                {stack.slug}
              </span>
              <span className="ml-auto font-mono text-[10px] text-muted-foreground/70">
                {doneCount > 0 ? `${doneCount}/${stack.labs.length}` : stack.labs.length}
              </span>
            </button>

            {/* Lab list */}
            {isOpen && (
              <ul id={`stack-${stack.slug}-labs`} className="mt-1 space-y-px pl-7">
                {stack.labs.map((lab) => {
                  const isActive = isCurrent && lab.labKey === currentLabKey
                  const completed = isDone(lab.slug)
                  return (
                    <li key={lab.slug}>
                      <NavLink
                        to={`/${lab.slug}`}
                        onClick={onNavigate}
                        className={({ isActive: navActive }) =>
                          cn(
                            'flex cursor-pointer items-start gap-2 rounded-md px-2 py-1.5 text-xs leading-snug transition-colors',
                            isActive || navActive
                              ? 'bg-muted font-medium text-foreground'
                              : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                          )
                        }
                      >
                        {completed ? (
                          <CheckCircle2
                            className="mt-0.5 h-3 w-3 shrink-0 text-[--success]"
                            aria-label="ทำเสร็จแล้ว"
                          />
                        ) : (
                          <span
                            className="mt-px font-mono text-[10px] tabular-nums text-muted-foreground/60"
                            aria-hidden="true"
                          >
                            {String(lab.order).padStart(2, '0')}
                          </span>
                        )}
                        <span className="min-w-0 flex-1">{lab.title}</span>
                      </NavLink>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        )
      })}
    </nav>
  )
}
