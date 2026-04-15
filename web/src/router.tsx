import { createBrowserRouter, Outlet } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AuthProvider } from '@/hooks/useAuth'
import { ThemeProvider } from '@/components/ThemeProvider'
import Home from '@/pages/Home'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import Profile from '@/pages/Profile'
import StackOverview from '@/pages/StackOverview'
import LabDetail from '@/pages/LabDetail'
import NotFound from '@/pages/NotFound'

/**
 * App layout — wrap everything in:
 * - ErrorBoundary (catch React errors → fallback UI)
 * - ThemeProvider (light/dark/system)
 * - AuthProvider (shared user state)
 * Toaster ต้องอยู่ใน tree เดียวกันเพื่อเรียก toast() จาก components ได้
 */
function RootLayout() {
  return (
    <ErrorBoundary>
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
    </ErrorBoundary>
  )
}

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/login', element: <Login /> },
      { path: '/register', element: <Register /> },
      {
        path: '/me',
        element: (
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        ),
      },
      { path: '/:stack', element: <StackOverview /> },
      { path: '/:stack/:labKey', element: <LabDetail /> },
      { path: '*', element: <NotFound /> },
    ],
  },
])
