import { forwardRef, useState, type ComponentProps } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * Password input with show/hide toggle button
 * - Inherit input props (autoComplete, required, ฯลฯ)
 * - Toggle button มี aria-label + ไม่ทำให้ form submit (type="button")
 */
type Props = Omit<ComponentProps<typeof Input>, 'type'>

export const PasswordInput = forwardRef<HTMLInputElement, Props>(function PasswordInput(
  { className, ...props },
  ref,
) {
  const [show, setShow] = useState(false)
  const Icon = show ? EyeOff : Eye

  return (
    <div className="relative">
      <Input
        {...props}
        ref={ref}
        type={show ? 'text' : 'password'}
        className={cn('pr-10', className)}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="absolute right-1 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-foreground"
        onClick={() => setShow((v) => !v)}
        aria-label={show ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
        aria-pressed={show}
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
      </Button>
    </div>
  )
})
