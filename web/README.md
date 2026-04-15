# Dev Labs Web

Frontend React สำหรับเว็บ dev-labs — Vite + React 19 + TypeScript + Tailwind v4

## Prerequisites

- Node.js 20+
- Backend API รันอยู่ที่ `http://localhost:3000` (ดู [api/README.md](../api/README.md))

## Setup ครั้งแรก

```bash
# 1. ติดตั้ง dependencies
npm install

# 2. copy env
cp .env.example .env
# ปกติไม่ต้องแก้อะไร ถ้า API รันที่ port 3000
```

## Development

```bash
npm run dev
```

เว็บจะรันที่ `http://localhost:5173`

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | รัน Vite dev server |
| `npm run build` | Build production (tsc + vite build) → `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run lint` | ESLint |

## Routes (Slice 0)

| Path | หน้า | Auth |
|------|-----|------|
| `/` | Home — 4 stack cards | ❌ |
| `/login` | Login — email + password | ❌ |
| `/register` | Register — สร้างบัญชีใหม่ | ❌ |
| `/:stack` | Stack placeholder (Coming soon) | ❌ |
| `*` | 404 Not Found | ❌ |

## โครงสร้าง

```
web/
├── src/
│   ├── components/
│   │   ├── ui/              # button (shadcn-style)
│   │   ├── Header.tsx       # top nav + user menu
│   │   └── ProtectedRoute.tsx
│   ├── hooks/
│   │   └── useAuth.ts       # auth state (ผูกกับ /auth/me)
│   ├── lib/
│   │   ├── api.ts           # fetch wrapper + authApi
│   │   └── utils.ts         # cn() helper
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── StackComingSoon.tsx
│   │   └── NotFound.tsx
│   ├── index.css            # Tailwind v4 + theme tokens
│   ├── main.tsx             # entry
│   └── router.tsx           # route config
├── .env.example
└── vite.config.ts
```

## Tech stack

- **Vite 8** — build tool
- **React 19** — UI
- **React Router 7** — routing
- **Tailwind v4** — styling (`@import "tailwindcss"`)
- **lucide-react** — icons
- **class-variance-authority** + **tailwind-merge** + **clsx** — shadcn utilities

## ข้อควรระวัง

- ทุก request ไปที่ API ต้องใช้ `credentials: 'include'` (ตั้งไว้แล้วใน `lib/api.ts`) เพราะ JWT อยู่ใน httpOnly cookie
- CORS setup ที่ API ต้อง allow `http://localhost:5173` — ตั้งค่าแล้วใน `api/.env` (`WEB_ORIGIN`)
