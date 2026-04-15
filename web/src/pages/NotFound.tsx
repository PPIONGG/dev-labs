import { Link } from 'react-router-dom'
import { buttonVariants } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center">
      <div className="mb-6 text-6xl">🤷</div>
      <h1 className="text-3xl font-semibold text-[--color-foreground]">
        ไม่พบหน้านี้
      </h1>
      <p className="mt-3 text-[--color-muted-foreground]">
        หน้าที่คุณกำลังค้นหาอาจถูกย้ายหรือยังไม่ถูกสร้าง
      </p>
      <Link
        to="/"
        className={`${buttonVariants({ variant: 'outline', size: 'md' })} mt-6`}
      >
        กลับหน้าแรก
      </Link>
    </div>
  )
}
