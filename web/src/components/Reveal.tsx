import { type ReactNode } from 'react'
import { useInView } from '@/hooks/useInView'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { cn } from '@/lib/utils'

interface Props {
  children: ReactNode
  /** Delay (ms) ก่อนเริ่ม animate */
  delay?: number
  /** ทิศทางที่ slide จาก */
  from?: 'bottom' | 'top' | 'left' | 'right' | 'none'
  /** className เพิ่ม (เผื่อ wrap layout) */
  className?: string
  /** as element (default div) */
  as?: 'div' | 'section' | 'article' | 'li'
  /** html id — สำหรับ anchor link / scroll-to */
  id?: string
}

/**
 * Wrapper — fade + slide เมื่อ scroll เข้ามาใน viewport
 *
 * - Trigger ครั้งเดียว (once: true) เพื่อไม่ให้กระตุก
 * - เคารพ prefers-reduced-motion → แสดงทันทีไม่มี animation
 */
export function Reveal({
  children,
  delay = 0,
  from = 'bottom',
  className,
  as: Tag = 'div',
  id,
}: Props) {
  const [ref, inView] = useInView<HTMLDivElement>()
  const reduced = useReducedMotion()

  const enterClass = reduced
    ? 'opacity-100'
    : inView
      ? 'opacity-100 translate-x-0 translate-y-0'
      : (() => {
          switch (from) {
            case 'top':
              return 'opacity-0 -translate-y-4'
            case 'left':
              return 'opacity-0 -translate-x-4'
            case 'right':
              return 'opacity-0 translate-x-4'
            case 'none':
              return 'opacity-0'
            default:
              return 'opacity-0 translate-y-4'
          }
        })()

  return (
    <Tag
      ref={ref as never}
      id={id}
      className={cn(
        'transition-all duration-700 ease-out will-change-[opacity,transform]',
        enterClass,
        className,
      )}
      style={{ transitionDelay: inView && !reduced ? `${delay}ms` : '0ms' }}
    >
      {children}
    </Tag>
  )
}
