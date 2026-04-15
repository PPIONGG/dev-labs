import type { Request, Response, NextFunction } from 'express'
import { AUTH_COOKIE_NAME, verifyAuthToken } from '../lib/jwt.js'

/**
 * ขยาย Express Request ให้มี `userId` (set โดย middleware นี้)
 */
declare module 'express-serve-static-core' {
  interface Request {
    userId?: string
  }
}

/**
 * Middleware: ถ้ามี JWT cookie และ valid → set `req.userId`
 * ถ้าไม่มี / invalid → ไม่ set อะไร, route handler ตัดสินใจเองว่าจะ reject หรือไม่
 *
 * ใช้ร่วมกับ `requireAuth` เพื่อบังคับ login
 */
export function attachUser(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.[AUTH_COOKIE_NAME]
  if (token) {
    const payload = verifyAuthToken(token)
    if (payload) {
      req.userId = payload.sub
    }
  }
  next()
}

/**
 * Middleware: บังคับ login — ถ้าไม่มี `req.userId` → 401
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.userId) {
    res.status(401).json({ error: 'UNAUTHENTICATED' })
    return
  }
  next()
}
