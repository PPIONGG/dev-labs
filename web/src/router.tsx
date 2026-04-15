import { createBrowserRouter, Outlet } from 'react-router-dom'
import { Header } from '@/components/Header'
import { AuthProvider } from '@/hooks/useAuth'
import Home from '@/pages/Home'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import StackComingSoon from '@/pages/StackComingSoon'
import NotFound from '@/pages/NotFound'

/**
 * Layout หลัก — wrap ด้วย AuthProvider ให้ทุก component ใน tree
 * แชร์ auth state เดียวกัน (Header + pages)
 */
function RootLayout() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-background">
        <Header />
        <main>
          <Outlet />
        </main>
      </div>
    </AuthProvider>
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
