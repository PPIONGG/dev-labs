import bcrypt from 'bcryptjs'

const SALT_ROUNDS = 10

/** Hash password ด้วย bcrypt — เก็บลง DB */
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS)
}

/** เปรียบเทียบ password ที่ user กรอก กับ hash ใน DB */
export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash)
}
