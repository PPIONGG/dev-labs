import {
  forwardRef,
  useRef,
  type CSSProperties,
  type HTMLAttributes,
  type MouseEvent,
} from 'react'
import { cn } from '@/lib/utils'

/**
 * Card wrapper ที่มี gradient spotlight ตามตำแหน่งเมาส์
 *
 * Tech:
 * - onMouseMove → set CSS variables `--mx`, `--my` (% of card)
 * - Inner overlay div ใช้ radial-gradient ตำแหน่ง --mx/--my
 * - Hover-only effect (ไม่กระทบ touch — แค่ไม่เห็น spotlight)
 */
type Props = HTMLAttributes<HTMLDivElement>

export const SpotlightCard = forwardRef<HTMLDivElement, Props>(function SpotlightCard(
  { className, style, children, onMouseMove, ...props },
  forwardedRef,
) {
  const innerRef = useRef<HTMLDivElement | null>(null)

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const node = innerRef.current
    if (node) {
      const rect = node.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100
      node.style.setProperty('--mx', `${x}%`)
      node.style.setProperty('--my', `${y}%`)
    }
    onMouseMove?.(e)
  }

  return (
    <div
      ref={(node) => {
        innerRef.current = node
        if (typeof forwardedRef === 'function') forwardedRef(node)
        else if (forwardedRef) forwardedRef.current = node
      }}
      onMouseMove={handleMouseMove}
      className={cn('group relative isolate overflow-hidden', className)}
      style={
        {
          ...style,
          '--mx': '50%',
          '--my': '50%',
        } as CSSProperties
      }
      {...props}
    >
      {/* Spotlight layer */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100 motion-reduce:hidden"
        style={{
          background:
            'radial-gradient(450px circle at var(--mx) var(--my), color-mix(in oklab, var(--color-success) 22%, transparent), transparent 45%)',
        }}
      />
      {children}
    </div>
  )
})
