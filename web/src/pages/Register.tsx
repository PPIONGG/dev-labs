import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { AlertCircle } from 'lucide-react'
import {
  Form,
  FormControl,
  FormDescription,
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

const registerSchema = z.object({
  displayName: z.string().max(100, 'ชื่อยาวสุด 100 ตัว').optional(),
  email: z.string().min(1, 'กรุณากรอกอีเมล').email('อีเมลไม่ถูกต้อง'),
  password: z
    .string()
    .min(8, 'รหัสผ่านอย่างน้อย 8 ตัว')
    .max(72, 'รหัสผ่านยาวสุด 72 ตัว'),
})

type RegisterValues = z.infer<typeof registerSchema>

export default function Register() {
  useDocumentTitle('สมัครสมาชิก · Dev Labs')
  const { user, loading, register } = useAuth()
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { displayName: '', email: '', password: '' },
  })

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
        กำลังโหลด...
      </div>
    )
  }

  if (user) {
    return <Navigate to="/" replace />
  }

  async function onSubmit(values: RegisterValues) {
    setServerError(null)
    try {
      await register(values.email, values.password, values.displayName?.trim() || undefined)
      toast.success('สร้างบัญชีสำเร็จ! ยินดีต้อนรับ 👋')
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 'EMAIL_TAKEN') {
          setServerError('อีเมลนี้ถูกใช้แล้ว — ลองอีเมลอื่นหรือเข้าสู่ระบบ')
        } else if (err.code === 'VALIDATION') {
          setServerError('ข้อมูลไม่ถูกต้อง')
        } else {
          setServerError('สมัครสมาชิกไม่สำเร็จ ลองใหม่อีกครั้ง')
        }
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
            // sign up
          </div>
          <CardTitle className="font-display text-2xl tracking-tight">
            สร้างบัญชีใหม่
          </CardTitle>
          <CardDescription>ใช้ฟรี บันทึกความคืบหน้าและโน้ตส่วนตัว</CardDescription>
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
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ชื่อที่แสดง</FormLabel>
                    <FormControl>
                      <Input autoComplete="name" placeholder="เช่น สมชาย ใจดี" {...field} />
                    </FormControl>
                    <FormDescription>ไม่บังคับ — เว้นว่างได้</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                    <FormLabel>รหัสผ่าน</FormLabel>
                    <FormControl>
                      <PasswordInput autoComplete="new-password" {...field} />
                    </FormControl>
                    <FormDescription>อย่างน้อย 8 ตัว</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full cursor-pointer"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? 'กำลังสมัคร...' : 'สมัครสมาชิก'}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="justify-center text-sm text-muted-foreground">
          มีบัญชีอยู่แล้ว?
          <Link
            to="/login"
            className="ml-1 font-medium text-foreground underline-offset-4 hover:underline"
          >
            เข้าสู่ระบบ
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
