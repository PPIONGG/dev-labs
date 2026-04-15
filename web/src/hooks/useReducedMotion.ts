import { useEffect, useState } from 'react'

/**
 * Returns true when user OS / browser มี `prefers-reduced-motion: reduce`
 * ใช้ skip animation ที่ไม่จำเป็น (typewriter, marquee, parallax)
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handler = () => setReduced(mq.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return reduced
}
