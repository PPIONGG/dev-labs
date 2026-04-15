import { Link } from 'react-router-dom'
import { FlaskConical, ExternalLink } from 'lucide-react'

const YEAR = new Date().getFullYear()

export function Footer() {
  return (
    <footer className="mt-20 border-t border-border/60">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 font-display text-sm font-semibold tracking-tight">
            <FlaskConical className="h-4 w-4 text-[--success]" aria-hidden="true" />
            <span>dev-labs</span>
            <span className="ml-1 font-mono text-xs font-normal text-muted-foreground">
              v0.1 · slice-0
            </span>
          </div>

          <nav
            className="flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-xs text-muted-foreground"
            aria-label="Footer navigation"
          >
            <Link to="/" className="cursor-pointer hover:text-foreground">
              home
            </Link>
            <Link to="/docker" className="cursor-pointer hover:text-foreground">
              docker
            </Link>
            <Link to="/postgresql" className="cursor-pointer hover:text-foreground">
              postgresql
            </Link>
            <Link to="/redis" className="cursor-pointer hover:text-foreground">
              redis
            </Link>
            <Link to="/mongodb" className="cursor-pointer hover:text-foreground">
              mongodb
            </Link>
            <a
              href="https://github.com/thammasornlueadtaharn/dev-labs"
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex cursor-pointer items-center gap-1 hover:text-foreground"
            >
              github
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </a>
          </nav>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-border/60 pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono">© {YEAR} dev-labs · Built for learning backend</p>
          <p className="font-mono">
            Stack: React · Vite · Express · Prisma · PostgreSQL
          </p>
        </div>
      </div>
    </footer>
  )
}
