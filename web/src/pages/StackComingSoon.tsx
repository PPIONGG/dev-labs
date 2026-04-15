import { Link, useParams } from 'react-router-dom'
import { Construction, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

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
    <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <Construction className="h-7 w-7 text-muted-foreground" />
      </div>
      <h1 className="text-3xl font-bold tracking-tight">{name} labs กำลังมา</h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        ตอนนี้ยังเป็น placeholder — เนื้อหา labs จะถูกเพิ่มในรอบถัดไป พร้อม markdown content pipeline
      </p>
      <Button variant="outline" asChild className="mt-6">
        <Link to="/">
          <ArrowLeft className="mr-2 h-4 w-4" />
          กลับหน้าแรก
        </Link>
      </Button>
    </div>
  )
}
