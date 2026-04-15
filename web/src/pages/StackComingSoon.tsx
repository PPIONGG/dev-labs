import { useParams, Link } from 'react-router-dom'
import { buttonVariants } from '@/components/ui/button'

/**
 * Placeholder สำหรับหน้า stack (docker, postgresql, redis, mongodb)
 * จะมี content จริงใน slice ถัดไป (markdown pipeline + lab list)
 */
const STACK_NAMES: Record<string, string> = {
  docker: 'Docker',
  postgresql: 'PostgreSQL',
  redis: 'Redis',
  mongodb: 'MongoDB',
}

export default function StackComingSoon() {
  const { stack = '' } = useParams()
  const name = STACK_NAMES[stack] ?? 'Unknown'

  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center">
      <div className="mb-6 text-6xl">🚧</div>
      <h1 className="text-3xl font-semibold text-foreground">
        {name} labs กำลังมา
      </h1>
      <p className="mt-3 text-muted-foreground">
        ตอนนี้ยังเป็น placeholder — เนื้อหา labs จะถูกเพิ่มในรอบถัดไป
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
