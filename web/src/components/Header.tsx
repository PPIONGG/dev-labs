import { Link } from 'react-router-dom'
import { FlaskConical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ModeToggle } from '@/components/ModeToggle'
import { UserMenu } from '@/components/UserMenu'
import { useAuth } from '@/hooks/useAuth'

/**
 * Top navigation — logo + theme toggle + user menu / auth buttons
 */
export function Header() {
  const { user, loading } = useAuth()

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link
          to="/"
          className="flex items-center gap-2 font-semibold tracking-tight transition-opacity hover:opacity-80"
        >
          <FlaskConical className="h-5 w-5 text-primary" />
          <span>Dev Labs</span>
        </Link>

        <nav className="flex items-center gap-2">
          <ModeToggle />
          {loading ? (
            <Skeleton className="h-9 w-9 rounded-full" />
          ) : user ? (
            <UserMenu />
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login">เข้าสู่ระบบ</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/register">สมัครสมาชิก</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
