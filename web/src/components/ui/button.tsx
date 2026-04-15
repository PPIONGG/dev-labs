import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

/**
 * Button component ตามสไตล์ shadcn/ui — variant + size ผ่าน cva
 * ใช้ `asChild` ไม่ได้ในเวอร์ชันนี้ (ถ้าต้องการภายหลังเพิ่ม @radix-ui/react-slot)
 */
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-accent] disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-[--color-primary] text-[--color-primary-foreground] hover:bg-[--color-primary]/90',
        outline:
          'border border-[--color-border] bg-[--color-background] hover:bg-[--color-muted]',
        secondary:
          'bg-[--color-secondary] text-[--color-secondary-foreground] hover:bg-[--color-secondary]/80',
        ghost: 'hover:bg-[--color-muted]',
        destructive:
          'bg-[--color-destructive] text-[--color-destructive-foreground] hover:bg-[--color-destructive]/90',
      },
      size: {
        sm: 'h-8 px-3',
        md: 'h-10 px-4',
        lg: 'h-12 px-6 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  },
)

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  ),
)
Button.displayName = 'Button'

export { buttonVariants }
