import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * รวม class names + dedupe tailwind conflicts
 * ใช้เหมือน shadcn: `cn('px-4', condition && 'bg-red-500')`
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
