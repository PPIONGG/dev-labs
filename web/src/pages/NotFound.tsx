import { Link } from 'react-router-dom'
import { ArrowLeft, FileQuestion } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-4 text-center">
      <div
        className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-lg bg-muted ring-1 ring-border"
        aria-hidden="true"
      >
        <FileQuestion className="h-7 w-7 text-muted-foreground" />
      </div>
      <div className="mb-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
        // 404 · not_found
      </div>
      <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
        ไม่พบหน้านี้
      </h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        หน้าที่คุณกำลังค้นหาอาจถูกย้าย ลบ หรือยังไม่ถูกสร้าง
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
