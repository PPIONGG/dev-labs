import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, FileCode2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

const STACK_NAMES: Record<string, string> = {
  docker: 'Docker',
  postgresql: 'PostgreSQL',
  redis: 'Redis',
  mongodb: 'MongoDB',
}

export default function StackComingSoon() {
  const { stack = '' } = useParams()
  const name = STACK_NAMES[stack] ?? 'Unknown'
  useDocumentTitle(`${name} · Dev Labs`)

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-4 text-center">
      <div
        className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-lg bg-muted ring-1 ring-border"
        aria-hidden="true"
      >
        <FileCode2 className="h-7 w-7 text-muted-foreground" />
      </div>
      <div className="mb-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
        // coming soon
      </div>
      <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
        {name} labs
      </h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        เนื้อหา labs จะถูกเพิ่มในรอบถัดไป พร้อม markdown content pipeline + progress tracking
      </p>
      <Button variant="outline" asChild className="mt-6 cursor-pointer">
        <Link to="/">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          กลับหน้าแรก
        </Link>
      </Button>
    </div>
  )
}
