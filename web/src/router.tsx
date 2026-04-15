import { createBrowserRouter, Outlet } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { AuthProvider } from '@/hooks/useAuth'
import { ThemeProvider } from '@/components/ThemeProvider'
import Home from '@/pages/Home'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import StackComingSoon from '@/pages/StackComingSoon'
import NotFound from '@/pages/NotFound'

/**
 * App layout — wrap everything in ThemeProvider + AuthProvider
 * Toaster ต้องอยู่ใน tree เดียวกันเพื่อเรียก toast() จาก components ได้
 */
function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <div className="relative flex min-h-screen flex-col bg-background">
          <Header />
          <main className="flex-1">
            <Outlet />
          </main>
          <Footer />
        </div>
        <Toaster richColors position="top-right" />
      </AuthProvider>
    </ThemeProvider>
  )
}

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/login', element: <Login /> },
      { path: '/register', element: <Register /> },
      { path: '/:stack', element: <StackComingSoon /> },
      { path: '*', element: <NotFound /> },
    ],
  },
])
