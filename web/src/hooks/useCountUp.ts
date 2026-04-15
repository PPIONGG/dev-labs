import { useEffect, useState } from 'react'
import { useReducedMotion } from './useReducedMotion'

interface Options {
  /** เริ่ม animate เมื่อ true */
  start: boolean
  /** ค่า target (number) */
  end: number
  /** ระยะเวลา animation (ms) */
  duration?: number
  /** Decimals ที่จะแสดง */
  decimals?: number
}

/**
 * Hook: ค่อยๆ นับเลขจาก 0 ถึง `end` ใน `duration` ms
 *
 * - ใช้ requestAnimationFrame (smooth + ไม่กิน CPU)
 * - easeOut cubic เพื่อให้รู้สึกเป็นธรรมชาติ (เร็วช่วงแรก ช้าช่วงท้าย)
 * - เคารพ prefers-reduced-motion (skip animation, ตั้งค่าทันที)
 */
export function useCountUp({ start, end, duration = 1200, decimals = 0 }: Options): number {
  const [value, setValue] = useState(0)
  const reduced = useReducedMotion()

  useEffect(() => {
    if (!start) return
    if (reduced) {
      setValue(end)
      return
    }

    let frame = 0
    const startTs = performance.now()

    const tick = (now: number) => {
      const elapsed = now - startTs
      const progress = Math.min(elapsed / duration, 1)
      // easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3)
      const next = end * eased
      setValue(next)
      if (progress < 1) {
        frame = requestAnimationFrame(tick)
      }
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [start, end, duration, reduced])

  return decimals === 0 ? Math.round(value) : Number(value.toFixed(decimals))
}
