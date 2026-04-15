import { Link } from 'react-router-dom'
import { FlaskConical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ModeToggle } from '@/components/ModeToggle'
import { UserMenu } from '@/components/UserMenu'
import { useAuth } from '@/hooks/useAuth'

/**
 * Top navigation — Swiss minimal: mono brand + compact controls
 */
export function Header() {
  const { user, loading } = useAuth()

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/70 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link
          to="/"
          className="group flex cursor-pointer items-center gap-2 font-display text-[15px] font-semibold tracking-tight transition-colors hover:text-foreground/80"
        >
          <FlaskConical
            className="h-4 w-4 text-[--success] transition-transform duration-200 group-hover:rotate-12"
            aria-hidden="true"
          />
          <span>dev-labs</span>
        </Link>

        <nav className="flex items-center gap-2" aria-label="User navigation">
          <ModeToggle />
          {loading ? (
            <Skeleton className="h-9 w-9 rounded-full" />
          ) : user ? (
            <UserMenu />
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild className="cursor-pointer">
                <Link to="/login">เข้าสู่ระบบ</Link>
              </Button>
              <Button size="sm" asChild className="cursor-pointer">
                <Link to="/register">สมัครสมาชิก</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
