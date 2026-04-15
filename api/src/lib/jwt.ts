import jwt from 'jsonwebtoken'
import { env } from './env.js'

/** ข้อมูลที่ฝังใน JWT payload — เก็บแค่ user id ก็พอ (ข้อมูลอื่น query จาก DB) */
export interface JwtPayload {
  sub: string // user id
}

const EXPIRES_IN = '7d'

/** Sign JWT สำหรับ user — ส่งกลับ token string */
export function signAuthToken(userId: string): string {
  const payload: JwtPayload = { sub: userId }
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: EXPIRES_IN })
}

/** Verify JWT — คืน payload หรือ null ถ้าไม่ valid */
export function verifyAuthToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET)
    if (typeof decoded === 'object' && decoded !== null && 'sub' in decoded) {
      return { sub: String(decoded.sub) }
    }
    return null
  } catch {
    return null
  }
}

/** ชื่อ cookie ที่เก็บ JWT — ใช้ชื่อเดียวทุกที่ */
export const AUTH_COOKIE_NAME = 'dev_labs_auth'

/** Default cookie options สำหรับ httpOnly auth cookie */
export const authCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: env.NODE_ENV === 'production',
  path: '/',
  maxAge: 1000 * 60 * 60 * 24 * 7, // 7 วัน (sync กับ JWT expires)
}
