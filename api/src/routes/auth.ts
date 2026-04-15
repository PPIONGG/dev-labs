import { Router } from 'express'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma.js'
import { hashPassword, verifyPassword } from '../lib/password.js'
import {
  AUTH_COOKIE_NAME,
  authCookieOptions,
  signAuthToken,
} from '../lib/jwt.js'
import { requireAuth } from '../middleware/auth.js'

export const authRouter = Router()

// -------------------- Schemas (validation) --------------------

const registerSchema = z.object({
  email: z.string().email('email ไม่ถูกต้อง').max(254),
  password: z
    .string()
    .min(8, 'password อย่างน้อย 8 ตัว')
    .max(72, 'password ยาวสุด 72 ตัว'), // bcrypt limit
  displayName: z.string().min(1).max(100).optional(),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

// -------------------- Helpers --------------------

function toPublicUser(user: {
  id: string
  email: string
  displayName: string | null
  createdAt: Date
}) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    createdAt: user.createdAt.toISOString(),
  }
}

// -------------------- Routes --------------------

/** POST /auth/register — สร้างบัญชีใหม่ + login ทันที */
authRouter.post('/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({
      error: 'VALIDATION',
      details: parsed.error.flatten().fieldErrors,
    })
    return
  }

  const { email, password, displayName } = parsed.data
  const passwordHash = await hashPassword(password)

  try {
    const user = await prisma.user.create({
      data: { email: email.toLowerCase(), passwordHash, displayName },
      select: { id: true, email: true, displayName: true, createdAt: true },
    })

    const token = signAuthToken(user.id)
    res.cookie(AUTH_COOKIE_NAME, token, authCookieOptions)
    res.status(201).json({ user: toPublicUser(user) })
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2002'
    ) {
      res.status(409).json({ error: 'EMAIL_TAKEN' })
      return
    }
    throw err
  }
})

/** POST /auth/login — ตรวจสอบ email+password แล้ว issue cookie */
authRouter.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'VALIDATION' })
    return
  }

  const { email, password } = parsed.data
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  })

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    res.status(401).json({ error: 'INVALID_CREDENTIALS' })
    return
  }

  const token = signAuthToken(user.id)
  res.cookie(AUTH_COOKIE_NAME, token, authCookieOptions)
  res.json({ user: toPublicUser(user) })
})

/** POST /auth/logout — เคลียร์ cookie */
authRouter.post('/logout', (_req, res) => {
  res.clearCookie(AUTH_COOKIE_NAME, authCookieOptions)
  res.json({ ok: true })
})

/** GET /auth/me — คืน user ปัจจุบัน (ต้อง login) */
authRouter.get('/me', requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId! },
    select: { id: true, email: true, displayName: true, createdAt: true },
  })

  if (!user) {
    // Edge case: token valid แต่ user ถูกลบไปแล้ว
    res.clearCookie(AUTH_COOKIE_NAME, authCookieOptions)
    res.status(401).json({ error: 'USER_NOT_FOUND' })
    return
  }

  res.json({ user: toPublicUser(user) })
})
