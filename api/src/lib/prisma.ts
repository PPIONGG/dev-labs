import { PrismaClient } from '@prisma/client'

/**
 * Prisma singleton — ใช้ client เดียวทั่วทั้ง app
 *
 * หมายเหตุ: ตอน `tsx watch` restart, ต้องระวัง multiple instances
 * เก็บไว้ใน globalThis เพื่อ share ข้ามการ reload
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
