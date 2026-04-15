import { useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { AlertCircle } from 'lucide-react'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { PasswordInput } from '@/components/PasswordInput'
import { useAuth } from '@/hooks/useAuth'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { ApiError } from '@/lib/api'
import { safeRedirect } from '@/lib/utils'

const loginSchema = z.object({
  email: z.string().min(1, 'กรุณากรอกอีเมล').email('อีเมลไม่ถูกต้อง'),
  password: z.string().min(1, 'กรุณากรอกรหัสผ่าน'),
})

type LoginValues = z.infer<typeof loginSchema>

export default function Login() {
  useDocumentTitle('เข้าสู่ระบบ · Dev Labs')
  const { user, loading, login } = useAuth()
  const [searchParams] = useSearchParams()
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
        กำลังโหลด...
      </div>
    )
  }

  if (user) {
    const next = safeRedirect(searchParams.get('next'))
    return <Navigate to={next} replace />
  }

  async function onSubmit(values: LoginValues) {
    setServerError(null)
    try {
      await login(values.email, values.password)
      toast.success('เข้าสู่ระบบสำเร็จ')
    } catch (err) {
      if (err instanceof ApiError && err.code === 'INVALID_CREDENTIALS') {
        setServerError('อีเมลหรือรหัสผ่านไม่ถูกต้อง')
      } else {
        setServerError('เกิดข้อผิดพลาด ลองใหม่อีกครั้ง')
        console.error(err)
      }
    }
  }

  return (
    <div className="container flex min-h-[80vh] items-center justify-center px-4 py-10">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-1 text-center">
          <div className="mb-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
            // sign in
          </div>
          <CardTitle className="font-display text-2xl tracking-tight">
            เข้าสู่ Dev Labs
          </CardTitle>
          <CardDescription>ใส่อีเมลและรหัสผ่านของคุณ</CardDescription>
        </CardHeader>
        <CardContent>
          {serverError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>อีเมล</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        autoComplete="email"
                        placeholder="name@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>รหัสผ่าน</FormLabel>
                      <button
                        type="button"
                        onClick={() => toast.info('ฟีเจอร์ลืมรหัสผ่านยังไม่เปิดใช้')}
                        className="cursor-pointer font-mono text-[11px] text-muted-foreground hover:text-foreground hover:underline"
                      >
                        ลืมรหัสผ่าน?
                      </button>
                    </div>
                    <FormControl>
                      <PasswordInput autoComplete="current-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full cursor-pointer"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="justify-center text-sm text-muted-foreground">
          ยังไม่มีบัญชี?
          <Link
            to="/register"
            className="ml-1 font-medium text-foreground underline-offset-4 hover:underline"
          >
            สมัครสมาชิก
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
