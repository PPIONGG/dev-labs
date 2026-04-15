import { Link, NavLink } from 'react-router-dom'
import { FlaskConical } from 'lucide-react'
import { STACKS } from '@/lib/stacks'
import { cn } from '@/lib/utils'

const YEAR = new Date().getFullYear()

const FOOTER_LINKS: { to: string; label: string; end?: boolean }[] = [
  { to: '/', label: 'home', end: true },
  ...STACKS.map((s) => ({ to: `/${s.slug}`, label: s.slug })),
]

export function Footer() {
  return (
    <footer className="mt-20 border-t border-border/60">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <Link
            to="/"
            className="flex cursor-pointer items-center gap-2 font-display text-sm font-semibold tracking-tight transition-opacity hover:opacity-80"
          >
            <FlaskConical className="h-4 w-4 text-[--success]" aria-hidden="true" />
            <span>dev-labs</span>
            <span className="ml-1 font-mono text-xs font-normal text-muted-foreground">
              v0.1 · slice-0
            </span>
          </Link>

          <nav
            className="flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-xs"
            aria-label="Footer navigation"
          >
            {FOOTER_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  cn(
                    'cursor-pointer transition-colors',
                    isActive
                      ? 'text-foreground'
                      : 'text-muted-foreground hover:text-foreground',
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-border/60 pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono">© {YEAR} dev-labs · Built for learning</p>
          <p className="font-mono">
            Stack: React · Vite · Express · Prisma · PostgreSQL
          </p>
        </div>
      </div>
    </footer>
  )
}
