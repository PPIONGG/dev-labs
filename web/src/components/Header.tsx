import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { FlaskConical, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { ModeToggle } from '@/components/ModeToggle'
import { UserMenu } from '@/components/UserMenu'
import { useAuth } from '@/hooks/useAuth'
import { STACKS } from '@/lib/stacks'
import { cn } from '@/lib/utils'

const NAV_LINKS = STACKS.map((s) => ({ to: `/${s.slug}`, label: s.slug }))

/**
 * Top navigation — Swiss minimal: mono brand + compact controls
 * - Stack links อยู่ตรงกลาง (desktop), ซ่อนในมือถือ (กดเมนูแฮมเบอร์เกอร์)
 * - Active state ใช้ NavLink — highlight stack ที่ user เปิดอยู่
 */
export function Header() {
  const { user, loading } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/70 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
        {/* Brand */}
        <Link
          to="/"
          className="group flex shrink-0 cursor-pointer items-center gap-2 font-display text-[15px] font-semibold tracking-tight transition-colors hover:text-foreground/80"
        >
          <FlaskConical
            className="h-4 w-4 text-[--success] transition-transform duration-200 group-hover:rotate-12"
            aria-hidden="true"
          />
          <span>dev-labs</span>
        </Link>

        {/* Desktop nav (md+) */}
        <nav
          className="hidden flex-1 items-center justify-center gap-1 md:flex"
          aria-label="Stacks"
        >
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  'rounded-md px-3 py-1.5 font-mono text-xs transition-colors',
                  isActive
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <ModeToggle />
          {loading ? (
            <Skeleton className="h-9 w-9 rounded-full" />
          ) : user ? (
            <UserMenu />
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="hidden cursor-pointer sm:inline-flex"
              >
                <Link to="/login">เข้าสู่ระบบ</Link>
              </Button>
              <Button size="sm" asChild className="cursor-pointer">
                <Link to="/register">สมัครสมาชิก</Link>
              </Button>
            </>
          )}

          {/* Mobile menu toggle — only on small screens */}
          <Button
            variant="ghost"
            size="icon-sm"
            className="cursor-pointer md:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? 'ปิดเมนู' : 'เปิดเมนู'}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
          >
            {mobileOpen ? (
              <X className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Menu className="h-4 w-4" aria-hidden="true" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile menu drawer */}
      {mobileOpen && (
        <div
          id="mobile-nav"
          className="border-t border-border/60 bg-background md:hidden"
        >
          <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'rounded-md px-3 py-2 font-mono text-sm transition-colors',
                    isActive
                      ? 'bg-muted text-foreground'
                      : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
            {!user && (
              <>
                <Separator className="my-2" />
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-md px-3 py-2 text-sm hover:bg-muted/60"
                >
                  เข้าสู่ระบบ
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
