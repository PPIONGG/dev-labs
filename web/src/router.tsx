import { createBrowserRouter, Outlet } from 'react-router-dom'
import { Header } from '@/components/Header'
import Home from '@/pages/Home'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import StackComingSoon from '@/pages/StackComingSoon'
import NotFound from '@/pages/NotFound'

/**
 * Layout หลัก — Header + <Outlet /> สำหรับ nested routes
 * Footer ยังไม่ต้อง ใน slice 0
 */
function RootLayout() {
  return (
    <div className="min-h-screen bg-[--color-background]">
      <Header />
      <main>
        <Outlet />
      </main>
    </div>
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
