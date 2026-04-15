import 'dotenv/config'
import { z } from 'zod'

/**
 * Parse + validate environment variables ครั้งเดียวตอน boot
 * ถ้าขาดค่าจำเป็น — throw ทันที ก่อน server จะ start
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET ต้องยาวอย่างน้อย 32 chars'),
  WEB_ORIGIN: z.string().url().default('http://localhost:5173'),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('❌ Environment variables ไม่ถูกต้อง:')
  console.error(parsed.error.flatten().fieldErrors)
  process.exit(1)
}

export const env = parsed.data
