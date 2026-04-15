import { Link } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Button, buttonVariants } from '@/components/ui/button'

/**
 * Header แบบเรียบง่าย — logo + user menu
 */
export function Header() {
  const { user, loading, logout } = useAuth()

  const handleLogout = async () => {
    try {
      await logout()
    } catch (err) {
      console.error('[logout]', err)
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <span className="text-lg">🧪</span>
          <span>Dev Labs</span>
        </Link>

        <nav className="flex items-center gap-3">
          {loading ? (
            <span className="text-sm text-muted-foreground">...</span>
          ) : user ? (
            <>
              <span className="hidden text-sm text-muted-foreground sm:inline">
                {user.displayName ?? user.email}
              </span>
              <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="ออกจากระบบ">
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className={buttonVariants({ variant: 'ghost', size: 'sm' })}
              >
                เข้าสู่ระบบ
              </Link>
              <Link
                to="/register"
                className={buttonVariants({ variant: 'outline', size: 'sm' })}
              >
                สมัครสมาชิก
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
