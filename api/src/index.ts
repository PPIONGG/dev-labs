import express, { type NextFunction, type Request, type Response } from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import { env } from './lib/env.js'
import { attachUser } from './middleware/auth.js'
import { authRouter } from './routes/auth.js'
import { progressRouter } from './routes/progress.js'

const app = express()

// -------------------- Middleware --------------------

app.use(
  cors({
    origin: env.WEB_ORIGIN,
    credentials: true, // จำเป็นเพราะใช้ cookie cross-origin
  }),
)
app.use(express.json({ limit: '100kb' }))
app.use(cookieParser())
app.use(attachUser) // populate req.userId ถ้ามี cookie valid

// -------------------- Routes --------------------

app.get('/health', (_req, res) => {
  res.json({ ok: true, env: env.NODE_ENV })
})

app.use('/auth', authRouter)
app.use('/progress', progressRouter)

// 404 fallback
app.use((req, res) => {
  res.status(404).json({ error: 'NOT_FOUND', path: req.path })
})

// Error handler — จับ exception ที่ไม่ได้ handle ใน route
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[error]', err)
  res.status(500).json({ error: 'INTERNAL_ERROR' })
})

// -------------------- Start --------------------

app.listen(env.PORT, () => {
  console.log(`🚀 API listening on http://localhost:${env.PORT}`)
  console.log(`   CORS origin: ${env.WEB_ORIGIN}`)
  console.log(`   NODE_ENV: ${env.NODE_ENV}`)
})
