import { Router } from 'express'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma.js'
import { LAB_SLUG_PATTERN } from '../lib/labSlug.js'
import { requireAuth } from '../middleware/auth.js'

export const progressRouter = Router()

// All endpoints require auth
progressRouter.use(requireAuth)

// -------------------- Validation --------------------

const labSlugSchema = z
  .string()
  .min(1)
  .max(120)
  .regex(LAB_SLUG_PATTERN, 'invalid lab slug format')

const markBodySchema = z.object({
  labSlug: labSlugSchema,
})

// -------------------- Routes --------------------

/**
 * GET /progress
 * คืน list ของ labSlug ที่ user ทำเสร็จ + completedAt
 */
progressRouter.get('/', async (req, res) => {
  const items = await prisma.labProgress.findMany({
    where: { userId: req.userId! },
    select: { labSlug: true, completedAt: true },
    orderBy: { completedAt: 'desc' },
  })
  res.json({
    items: items.map((i) => ({
      labSlug: i.labSlug,
      completedAt: i.completedAt.toISOString(),
    })),
  })
})

/**
 * POST /progress
 * Mark lab as done (idempotent — ถ้าทำเสร็จแล้วไม่ error)
 */
progressRouter.post('/', async (req, res) => {
  const parsed = markBodySchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({
      error: 'VALIDATION',
      details: parsed.error.flatten().fieldErrors,
    })
    return
  }

  const { labSlug } = parsed.data
  const userId = req.userId!

  // Upsert — ถ้ามีอยู่แล้วไม่ update completedAt (preserve original timestamp)
  const entry = await prisma.labProgress.upsert({
    where: { userId_labSlug: { userId, labSlug } },
    create: { userId, labSlug },
    update: {}, // no-op
    select: { labSlug: true, completedAt: true },
  })

  res.status(201).json({
    item: {
      labSlug: entry.labSlug,
      completedAt: entry.completedAt.toISOString(),
    },
  })
})

/**
 * DELETE /progress/:stack/:labKey
 * Unmark lab — ถ้าไม่มีอยู่ก็คืน 200 (idempotent)
 *
 * NOTE: ใช้ 2 path params แทน "labSlug" เดียว เพราะ Express
 * decode "/" ใน param แยกเป็น 2 ส่วนอัตโนมัติ
 */
progressRouter.delete('/:stack/:labKey', async (req, res) => {
  const labSlug = `${req.params.stack}/${req.params.labKey}`
  const parsed = labSlugSchema.safeParse(labSlug)
  if (!parsed.success) {
    res.status(400).json({ error: 'VALIDATION' })
    return
  }

  try {
    await prisma.labProgress.delete({
      where: { userId_labSlug: { userId: req.userId!, labSlug } },
    })
  } catch (err) {
    // P2025 = record not found — idempotent OK
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2025'
    ) {
      res.json({ ok: true, alreadyAbsent: true })
      return
    }
    throw err
  }

  res.json({ ok: true })
})
