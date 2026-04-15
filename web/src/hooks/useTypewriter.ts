import { useEffect, useState } from 'react'
import { useReducedMotion } from './useReducedMotion'

interface Options {
  /** ข้อความเต็มที่ต้องการพิมพ์ */
  text: string
  /** เริ่มเมื่อ true */
  start: boolean
  /** ms ต่อ 1 ตัวอักษร */
  speed?: number
}

/**
 * พิมพ์ข้อความทีละตัวอักษร — เคารพ reduced-motion (แสดงเต็มทันที)
 */
export function useTypewriter({ text, start, speed = 50 }: Options): string {
  const reduced = useReducedMotion()
  const [typed, setTyped] = useState('')

  useEffect(() => {
    if (!start) {
      setTyped('')
      return
    }
    if (reduced) {
      setTyped(text)
      return
    }

    let i = 0
    setTyped('')
    const id = window.setInterval(() => {
      i += 1
      setTyped(text.slice(0, i))
      if (i >= text.length) window.clearInterval(id)
    }, speed)
    return () => window.clearInterval(id)
  }, [text, start, speed, reduced])

  return typed
}
