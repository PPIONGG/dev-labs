import { useEffect, useRef, useState } from 'react'

interface Options {
  /** Trigger เมื่อ N% ของ element เข้ามาใน viewport (0-1) */
  threshold?: number
  /** ขยาย/หด root margin (CSS string) */
  rootMargin?: string
  /** เรียก disconnect หลัง trigger ครั้งแรก (default true) */
  once?: boolean
}

/**
 * Hook: คืน [ref, inView] — true เมื่อ element เข้ามาใน viewport
 *
 * Usage:
 *   const [ref, inView] = useInView<HTMLDivElement>()
 *   <div ref={ref}>{inView && <Animation />}</div>
 */
export function useInView<T extends HTMLElement = HTMLElement>(
  options: Options = {},
): [React.RefObject<T | null>, boolean] {
  const { threshold = 0.15, rootMargin = '0px 0px -10% 0px', once = true } = options
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    // SSR / browser ที่ไม่รองรับ — แสดงเลย
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          if (once) observer.disconnect()
        } else if (!once) {
          setInView(false)
        }
      },
      { threshold, rootMargin },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [threshold, rootMargin, once])

  return [ref, inView]
}
