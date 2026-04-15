# Dev Labs Web — Design Specification

**Date:** 2026-04-15
**Status:** Draft — รอ user review

---

## 1. Overview

สร้างเว็บไซต์สำหรับอ่าน dev-labs — monorepo ที่รวม labs สำหรับเรียนรู้ Docker, PostgreSQL, Redis, MongoDB (65 labs รวม) — เปลี่ยนจาก README บน GitHub ให้เป็นเว็บที่อ่านง่าย มี search, progress tracking, notes, quiz, และ comments

เว็บนี้เป็น **Public Learning Platform** ให้ user login เข้ามาแล้วสะสมความคืบหน้า จดโน้ต ทำ quiz และ discuss ใต้ lab ได้

## 2. Goals & Non-goals

### Goals
- 📖 อ่านเนื้อหา 65 labs ได้สวยกว่า GitHub README
- 🔐 Login ด้วย OAuth (Google / GitHub)
- 📊 บันทึกความคืบหน้า per-user
- 📝 จดโน้ต + bookmark ต่อ lab
- ❓ ทำ Quiz ท้าย lab + เก็บคะแนน
- 💬 Comment ใต้ lab
- 🌗 Light / Dark mode
- 🔍 Full-text search ข้าม labs

### Non-goals (ตัดออกชัดเจน)
- ❌ **SEO** — ไม่ทำ SSR/SSG สำหรับ search engine
- ❌ **Server-side rendering** — SPA ล้วน
- ❌ **In-browser content editor** — เนื้อหาแก้ที่ markdown เท่านั้น (markdown-first)
- ❌ **In-browser code playground** — ผู้เรียนรัน Docker/SQL/JS ในเครื่องตัวเอง
- ❌ **Mobile native app**
- ❌ **Multi-language (i18n)** — ไทยอย่างเดียว

## 3. User Stories

1. **อ่าน lab** — ผู้เยี่ยมชมเปิดเว็บ เห็นรายการ labs แบ่งตาม stack (Docker/PostgreSQL/Redis/MongoDB) → คลิก lab → อ่าน markdown พร้อม TOC
2. **Login** — คลิก Login → เลือก Google/GitHub → redirect กลับเว็บพร้อม session
3. **Progress** — Login แล้วกดปุ่ม "Mark as Done" ที่ lab ใด — เว็บบันทึก + แสดงบน dashboard ส่วนตัว + progress bar ของแต่ละ stack
4. **Note** — ใน lab page มี panel โน้ต — user เขียน markdown เก็บไว้เฉพาะตน
5. **Bookmark** — กดดาวที่ lab เพื่อ bookmark → ดู bookmark ทั้งหมดใน `/me/bookmarks`
6. **Quiz** — ท้าย lab มีปุ่ม "ทำ Quiz" → 5-10 ข้อ MCQ → submit แล้วเห็นคะแนน + จุดที่ตอบผิด
7. **Comment** — ใต้ lab มี thread — user login อ่าน+ตอบได้ (moderation เบื้องต้น: report / admin delete)

## 4. Tech Stack

### Frontend
- **Vite 5+** — build tool
- **React 19** — UI library
- **TypeScript** — type safety
- **React Router v7** — client-side routing
- **Tailwind CSS v4** — styling
- **shadcn/ui** — component primitives (Button, Card, Dialog, ฯลฯ)
- **Radix UI** — a11y primitives (มากับ shadcn)
- **lucide-react** — icons
- **react-markdown** + **remark-gfm** + **rehype-highlight** + **rehype-slug** — markdown render + code highlighting + heading anchor
- **TanStack Query** — server state (caching, deduping Supabase calls)
- **Zustand** — local UI state (theme, sidebar toggle, ฯลฯ)
- **Fuse.js** — client-side full-text search
- **Vitest** — unit testing
- **@testing-library/react** — component testing

### Backend
- **Supabase** (managed Postgres + Auth + Realtime)
  - **`@supabase/supabase-js`** — client SDK
  - **Auth:** OAuth (Google, GitHub)
  - **Database:** Postgres 15+ with Row-Level Security (RLS)
  - **Realtime:** สำหรับ comments (optional — Phase 4)
  - **Supabase CLI** — migrations + type generation (`supabase gen types typescript`)

### Dev Tools
- **ESLint** + **Prettier** — lint + format
- **Husky** + **lint-staged** — pre-commit hooks
- **MSW (Mock Service Worker)** — mock Supabase ใน integration tests

## 5. Project Structure

```
dev-labs/
├── docker/                   # labs เดิม (19 labs)
├── postgresql/               # labs เดิม (17 labs)
├── redis/                    # labs เดิม (14 labs)
├── mongodb/                  # labs เดิม (15 labs)
├── web/                      # 🆕 เว็บใหม่
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/           # shadcn-generated primitives
│   │   │   ├── layout/       # Sidebar, Header, Footer
│   │   │   └── lab/          # LabTOC, ProgressBadge, QuizRunner, NotesPanel
│   │   ├── pages/
│   │   │   ├── Home.tsx
│   │   │   ├── StackOverview.tsx  # /docker, /postgresql, ฯลฯ
│   │   │   ├── LabDetail.tsx      # /docker/lab-01
│   │   │   ├── Login.tsx
│   │   │   ├── AuthCallback.tsx   # /auth/callback
│   │   │   ├── MyProgress.tsx     # /me
│   │   │   ├── MyBookmarks.tsx    # /me/bookmarks
│   │   │   └── NotFound.tsx
│   │   ├── lib/
│   │   │   ├── supabase.ts        # Supabase client singleton
│   │   │   ├── content.ts         # Lab content loader + index
│   │   │   ├── search.ts          # Fuse.js wrapper
│   │   │   └── utils.ts
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useProgress.ts
│   │   │   ├── useNotes.ts
│   │   │   ├── useBookmarks.ts
│   │   │   └── useTheme.ts
│   │   ├── types/
│   │   │   ├── lab.ts             # Lab, Stack, Level types
│   │   │   └── db.ts              # Supabase-generated types
│   │   ├── stores/
│   │   │   └── ui.ts              # Zustand (theme, sidebar)
│   │   ├── App.tsx
│   │   ├── router.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── public/
│   │   ├── favicon.svg
│   │   ├── og-image.png
│   │   └── content/          # 🤖 auto-generated (gitignored)
│   │       ├── index.json    # imported ใน src/lib/content.ts
│   │       └── labs/
│   │           ├── docker-lab-01.md
│   │           └── ...       # fetch() ตอน runtime
│   ├── scripts/
│   │   └── build-content.ts   # สแกน ../docker/, ../postgresql/, ฯลฯ
│   ├── supabase/
│   │   └── migrations/        # SQL migrations (ดู section 6)
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── postcss.config.js
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   ├── components.json        # shadcn config
│   └── README.md              # dev instructions
├── docs/
│   └── superpowers/
│       └── specs/
│           └── 2026-04-15-dev-labs-web-design.md  # ไฟล์นี้
├── .gitignore                 # + web/public/content/, web/node_modules/, web/dist/, .env
├── CLAUDE.md
└── README.md                  # อัพเดต link ไปเว็บ (หลัง deploy)
```

### รายละเอียดโฟลเดอร์สำคัญ

- **`web/content/`** — สร้างด้วย `scripts/build-content.ts` ตอน `vite dev` และ `vite build` (รันผ่าน `predev` / `prebuild` hook ใน package.json). Gitignored — ไม่ commit
- **`web/supabase/migrations/`** — SQL migrations สำหรับ tables + RLS policies (ดู section 6) ใช้ Supabase CLI รัน
- **`web/scripts/build-content.ts`** — Node script สแกน markdown → `index.json` + copy ไฟล์ .md

## 6. Data Model (Supabase Schema)

### Tables

#### `profiles` (extends `auth.users`)
```sql
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text,
  avatar_url text,
  created_at timestamptz default now()
);
```
สร้างอัตโนมัติผ่าน trigger เมื่อ user signup.

#### `lab_progress`
```sql
create table lab_progress (
  user_id uuid references auth.users(id) on delete cascade,
  lab_slug text not null,              -- เช่น "docker/lab-01-what-is-docker"
  completed_at timestamptz default now(),
  primary key (user_id, lab_slug)
);
create index on lab_progress (user_id);
```

#### `notes`
```sql
create table notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  lab_slug text not null,
  body text not null,                  -- markdown
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);
create index on notes (user_id, lab_slug);
```

#### `bookmarks`
```sql
create table bookmarks (
  user_id uuid references auth.users(id) on delete cascade,
  lab_slug text not null,
  created_at timestamptz default now(),
  primary key (user_id, lab_slug)
);
```

#### `quizzes` (master data — ไม่ต่อกับ user)
```sql
create table quizzes (
  id uuid primary key default gen_random_uuid(),
  lab_slug text not null,
  question text not null,
  choices jsonb not null,              -- [{"id":"a","text":"..."},...]
  correct_choice_id text not null,
  explanation text,
  order_index int default 0
);
create index on quizzes (lab_slug);
```

#### `quiz_attempts`
```sql
create table quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  lab_slug text not null,
  score int not null,
  total int not null,
  answers jsonb not null,              -- [{"quiz_id":"...","choice":"b"},...]
  attempted_at timestamptz default now()
);
create index on quiz_attempts (user_id, lab_slug, attempted_at desc);
```

#### `comments`
```sql
create table comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  lab_slug text not null,
  parent_id uuid references comments(id) on delete cascade,  -- threading
  body text not null,
  is_deleted boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index on comments (lab_slug, created_at desc);
create index on comments (parent_id);
```

### Row-Level Security (RLS) — เปิดทุก table

**กฎทั่วไป:**
- `profiles`: SELECT ทุกคน; UPDATE เฉพาะเจ้าของ
- `lab_progress` / `notes` / `bookmarks`: ทั้ง SELECT/INSERT/UPDATE/DELETE เฉพาะ `user_id = auth.uid()`
- `quizzes`: SELECT ทุกคน (anonymous ด้วย); INSERT/UPDATE เฉพาะ admin (จะทำ Phase 3+)
- `quiz_attempts`: SELECT/INSERT เฉพาะเจ้าของ
- `comments`: SELECT ทุกคน; INSERT เฉพาะ logged-in; UPDATE/DELETE เฉพาะเจ้าของ (soft delete)

ตัวอย่าง policy:
```sql
alter table notes enable row level security;
create policy "own notes only" on notes
  for all using (auth.uid() = user_id);
```

### Triggers

#### auto-create profile on signup
```sql
create function public.handle_new_user() returns trigger as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

#### auto-update `updated_at` on notes / comments
```sql
create function public.set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger notes_set_updated_at
  before update on notes
  for each row execute procedure public.set_updated_at();

create trigger comments_set_updated_at
  before update on comments
  for each row execute procedure public.set_updated_at();
```

## 7. Routes & Pages

| Path | Component | Auth Required | Description |
|------|-----------|---------------|-------------|
| `/` | Home | ❌ | หน้าแรก hero + 4 stack cards + latest activity (ถ้า login) |
| `/docker` | StackOverview | ❌ | รายการ docker labs แบ่งตาม Level |
| `/postgresql` | StackOverview | ❌ | PostgreSQL labs |
| `/redis` | StackOverview | ❌ | Redis labs |
| `/mongodb` | StackOverview | ❌ | MongoDB labs |
| `/:stack/:labKey` | LabDetail | ❌ (อ่านได้) | หน้าเนื้อหา lab + TOC + progress/notes/quiz (ถ้า login) |
| `/search` | Search | ❌ | ค้นหา full-text ข้าม labs |
| `/login` | Login | ❌ | ปุ่ม OAuth Google/GitHub |
| `/auth/callback` | AuthCallback | ❌ | จัดการ OAuth redirect |
| `/me` | MyProgress | ✅ | Dashboard ส่วนตัว — streak, progress %, recent labs |
| `/me/bookmarks` | MyBookmarks | ✅ | รายการ bookmark |
| `/me/notes` | MyNotes | ✅ | โน้ตทั้งหมด (cross-lab) |
| `*` | NotFound | ❌ | 404 |

**ProtectedRoute HOC** — ตรวจ `useAuth()` หาก `user == null` → redirect ไป `/login?next=<current>`

### URL param vs DB slug convention

- **URL param:** `stack` + `labKey` (folder name เท่านั้น) — เช่น `/docker/lab-01-what-is-docker`
- **DB `lab_slug`:** รวม stack ด้วย — เช่น `"docker/lab-01-what-is-docker"`
- **ในโค้ด:** `const labSlug = \`${params.stack}/${params.labKey}\`` → ใช้ key นี้ query Supabase

## 8. Architecture

### 8.1 Auth Flow
```
1. User กด "Login with GitHub" ที่ /login
   → supabase.auth.signInWithOAuth({ provider: 'github' })
2. Redirect ไป GitHub OAuth
3. GitHub redirect กลับมาที่ /auth/callback?code=xxx
4. AuthCallback page:
   - supabase.auth.exchangeCodeForSession(code)
   - Navigate to /me (หรือ ?next= ถ้ามี)
5. Trigger `on_auth_user_created` สร้าง row ใน profiles อัตโนมัติ
6. useAuth() subscribe auth state → เก็บ user ใน Zustand
```

### 8.2 Content Data Flow
```
Build time:
  scripts/build-content.ts
    → สแกน ../docker/**/README.md, ../postgresql/**/README.md, ...
    → แยก frontmatter (ถ้ามี) + body
    → generate web/content/index.json:
      [
        {
          "slug": "docker/lab-01-what-is-docker",
          "stack": "docker",
          "level": 1,
          "order": 1,
          "title": "Docker คืออะไร? ทำไมต้องใช้?",
          "type": "concept",
          "path": "labs/docker-lab-01.md"
        },
        ...
      ]
    → copy .md ไป web/content/labs/

Runtime:
  - lib/content.ts: `import index from '@/../content/index.json'` (direct import, bundled เข้า JS)
  - LabDetail page: fetch ไฟล์ markdown จาก public path (เช่น `/content/labs/docker-lab-01.md`)
    - วิธีทำ: `scripts/build-content.ts` copy ไป `web/public/content/labs/` — Vite serve static
  - Cache ด้วย TanStack Query (staleTime: Infinity — markdown ไม่เปลี่ยนใน runtime)
```

### 8.3 User Data Flow
```
Component → custom hook (useProgress) → TanStack Query → Supabase client → Postgres
                                              ↓
                                          cache + refetch
```

### 8.4 Component Layering

```
App
 └── RouterProvider
      ├── Layout (Sidebar + Header + <Outlet/>)
      │    ├── Sidebar (nav tree, highlight current)
      │    ├── Header (search input, theme toggle, user menu)
      │    └── Main content
      │         └── <Page /> (Home / StackOverview / LabDetail / ...)
      └── Toaster (shadcn toast)
```

## 9. Content Pipeline

### `scripts/build-content.ts` — ขั้นตอน

1. รายการ stacks: `['docker', 'postgresql', 'redis', 'mongodb']`
2. สำหรับแต่ละ stack:
   - `glob('../<stack>/lab-*/README.md')`
   - Parse ชื่อ lab จาก folder (เช่น `lab-01-what-is-docker` → slug = `docker/lab-01-what-is-docker`, order = 1)
   - อ่าน README → extract title (H1 ตัวแรก)
   - Copy → `web/content/labs/<stack>-<labFolder>.md`
3. ประกอบ `index.json`
4. Summary log: `✓ 65 labs indexed`

### การ watch (dev mode)
- Script รันครั้งแรกใน `predev`
- ไม่ watch — ถ้าแก้ markdown ต้อง rerun: `npm run build:content` + refresh browser
- ถ้าจะ live-reload: ใช้ `chokidar` ใน dev script (future improvement)

## 10. Phased Rollout (MVP → Incremental)

### 🎯 Slice 0 — Today's Scope (เริ่มจากตรงนี้)

**Auth-only scaffold** — เห็นเว็บวิ่ง + login ได้ ก่อนจะเติมเนื้อหา labs

- Project scaffold (Vite + React + TS + Tailwind + shadcn)
- React Router setup
- Supabase client + `.env` config
- **Auth** — OAuth Google + GitHub (ไม่มี email/password)
- Pages:
  - `/login` — ปุ่ม OAuth 2 ปุ่ม
  - `/auth/callback` — handle OAuth redirect → `/`
  - `/` — Home (hero + 4 stack cards placeholder + user menu)
  - `/docker`, `/postgresql`, `/redis`, `/mongodb` — "Coming soon" placeholder
- `ProtectedRoute` component (ยังไม่ใช้ แต่พร้อมสำหรับ slice ถัดไป)
- Logout flow

**Deliverable วันนี้:** scaffold ครบ + หน้า login ทำงาน + หน้าแรกแสดงชื่อ user ได้

### 🎯 Phase 1 — MVP (slice ถัดไป)

- Layout: Sidebar + Header + content area
- Dark/Light theme toggle
- Content pipeline (`build-content.ts`) — index 65 labs
- Pages: StackOverview (จริง), LabDetail, Search, NotFound
- Markdown render (react-markdown + syntax highlight + TOC)
- Fuse.js full-text search
- `profiles`, `lab_progress` tables + RLS
- "Mark as Done" button on lab page
- `/me` — basic progress dashboard

**Deliverable Phase 1:** เว็บที่อ่าน labs ได้, login ได้, track progress ได้

### 🎯 Phase 2 — Personal notes
- `notes`, `bookmarks` tables + RLS
- NotesPanel ใน LabDetail (markdown editor + preview)
- Bookmark button + `/me/bookmarks` page
- `/me/notes` — list โน้ตทั้งหมด

### 🎯 Phase 3 — Quiz
- `quizzes`, `quiz_attempts` tables + RLS
- Seed quiz data (คำถามเขียนใส่ SQL หรือ CSV import)
- QuizRunner component
- Quiz history ในหน้า `/me`

### 🎯 Phase 4 — Comments
- `comments` table + RLS + moderation flag
- Comment thread ใต้ lab (nested 1 level)
- Realtime subscribe (optional)
- Report button (เก็บไว้ใน column `reported_by`)

## 11. Testing Strategy

- **Unit** (Vitest): utils, hooks, content loader — coverage 70%+
- **Component** (@testing-library/react): major components (LabList, LabDetail, NotesPanel, QuizRunner)
- **Integration:** mock Supabase client ด้วย `msw` — test auth flow, progress flow
- **Manual E2E:** smoke test checklist (ดูเว็บจริงทำงาน) — ใน spec ไม่เขียน automated E2E (ไว้ใช้ Playwright ทีหลังถ้าจำเป็น)

## 12. Deployment

- **Hosting:** Cloudflare Pages (tentative)
  - ฟรี, bandwidth unlimited, SPA support ดี
  - Build command: `cd web && npm run build`
  - Output dir: `web/dist`
- **Environment variables:**
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- **Supabase project:** free tier (500 MB DB, 50K MAU) — พอเยอะสำหรับ personal project
- **Custom domain:** ถ้ามี (เช่น `labs.<user>.dev`) — config ที่ Cloudflare Pages + Supabase auth allowed URLs

## 13. Security Considerations

- **RLS enabled everywhere** — user เห็นเฉพาะ data ของตน (ยกเว้น quizzes, comments public)
- **Supabase anon key** — ปลอดภัยที่จะเปิดใน client เพราะ RLS จำกัดสิ่งที่ทำได้
- **OAuth redirect URL** — whitelist ใน Supabase project settings
- **Comment moderation** — Phase 4 เพิ่ม `reported_by` + rate limit (ขั้นต่ำ 30s ระหว่าง comment)
- **XSS:** react-markdown สร้าง VDOM ไม่ใช้ `dangerouslySetInnerHTML` → ปลอดภัยโดย default

## 14. Accessibility (a11y)

- shadcn/ui / Radix ได้ a11y baseline
- Keyboard navigation: sidebar, search (Cmd+K), lab TOC
- ARIA labels สำหรับ icon buttons
- Color contrast ตาม WCAG AA (Tailwind default ok, ตรวจใน dark mode)

## 15. Open Questions (ยังไม่ตัดสินใจ)

1. **Hosting** — Cloudflare Pages (default), Vercel, Netlify? — พี่เลือกได้ตอน deploy
2. **Custom domain** — มี domain จะใช้ไหม หรือใช้ `*.pages.dev` ก็พอ?
3. **OAuth providers** — ยืนยัน Google + GitHub? เพิ่ม Apple/email/anonymous ไหม?
4. **Quiz content** — ใครเขียน? ผม (Claude) ช่วยเขียนก่อนจบ Phase 3?
5. **Admin role** — Phase 3+ ต้อง admin มาจัดการ quizzes และ moderate comments — user เดียว (พี่) หรือเพิ่มได้ภายหลัง?
6. **Analytics** — อยากมี pageview / user count ไหม (Plausible / Umami)?
7. **Error tracking** — Sentry? (free tier เยอะพอ) หรือไม่ต้อง?

## 16. Success Criteria

Phase 1 (MVP) จบเมื่อ:
- ✅ เปิดเว็บ production อ่าน 65 labs ได้ครบ
- ✅ Login ด้วย GitHub ได้
- ✅ กด "Mark as Done" — ค่าบันทึกใน DB + แสดงใน `/me`
- ✅ Light/Dark toggle ทำงาน
- ✅ Search หา lab ได้
- ✅ ทดสอบใน Chrome, Safari, Firefox desktop

## 17. Out of Scope Reminder

สิ่งที่ **ไม่ทำ** ในโปรเจคนี้ (เพื่อคง scope):
- In-browser code editor / playground
- Native mobile app
- AI features (chat, auto-summary)
- Multi-language i18n
- User-submitted labs
- Social features นอกจาก comments (profile follow, DM)

---

**Next step:** หลัง user approve spec → invoke **writing-plans skill** เพื่อสร้าง implementation plan ของ Phase 1 (MVP)
