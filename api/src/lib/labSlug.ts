/**
 * Lab slug constants + validator
 *
 * labSlug รูปแบบ "<stack>/<lab-folder>"
 *   - stack: หนึ่งในค่า STACK_SLUGS
 *   - lab-folder: "lab-NN-<slug-words>" (เช่น "lab-01-what-is-docker")
 *
 * NOTE: stack list ต้อง sync กับ `web/src/lib/stacks.ts` ฝั่ง frontend
 * (เราไม่ share package กัน เพราะไม่ใช่ monorepo จริง — duplication ที่ยอมรับได้)
 */

export const STACK_SLUGS = [
  'docker',
  'postgresql',
  'redis',
  'mongodb',
] as const

export type StackSlug = (typeof STACK_SLUGS)[number]

/**
 * Pattern strict ป้องกัน arbitrary string ลง DB
 * ใช้ได้ทั้งตอน validate POST body และ reconstruct จาก path params ตอน DELETE
 */
export const LAB_SLUG_PATTERN = new RegExp(
  `^(${STACK_SLUGS.join('|')})\\/lab-\\d{1,3}-[a-z0-9-]+$`,
)
