import { useState, type ReactNode } from 'react'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { StackSidebar } from '@/components/StackSidebar'
import { useContentIndex } from '@/hooks/useContent'
import type { StackSlug } from '@/lib/content'
import { cn } from '@/lib/utils'

interface Props {
  /** stack ปัจจุบัน (จะ expand ใน sidebar) */
  currentStack?: StackSlug
  /** lab ปัจจุบัน (highlight ใน sidebar) */
  currentLabKey?: string
  /** เนื้อหาหลัก */
  children: ReactNode
  /** เนื้อหา TOC ขวา (optional — ใช้ในหน้า lab detail) */
  toc?: ReactNode
}

/**
 * Layout สำหรับหน้า /:stack และ /:stack/:lab
 *
 * Desktop: 2-3 columns
 *   ┌─────────┬───────────────┬───────┐
 *   │ Sidebar │ Content       │  TOC  │
 *   └─────────┴───────────────┴───────┘
 *
 * Mobile: sidebar เป็น drawer (toggle ผ่านปุ่ม "Lab list")
 */
export function StackLayout({ currentStack, currentLabKey, children, toc }: Props) {
  const { data: index, loading, error } = useContentIndex()
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <div className="mx-auto flex w-full max-w-7xl gap-0">
      {/* Sidebar — desktop sticky */}
      <aside
        className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-64 shrink-0 overflow-y-auto border-r border-border/60 bg-background/40 lg:block"
        aria-label="Sidebar navigation"
      >
        {loading ? (
          <SidebarSkeleton />
        ) : error ? (
          <SidebarError message={error.message} />
        ) : index ? (
          <StackSidebar
            index={index}
            currentStack={currentStack}
            currentLabKey={currentLabKey}
          />
        ) : null}
      </aside>

      {/* Mobile drawer toggle button — fixed bottom-right */}
      <Button
        size="sm"
        variant="outline"
        onClick={() => setDrawerOpen(true)}
        className="fixed bottom-4 right-4 z-30 cursor-pointer shadow-md lg:hidden"
        aria-label="เปิด lab list"
      >
        <Menu className="h-4 w-4" aria-hidden="true" />
        Labs
      </Button>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true">
          <button
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
            aria-label="ปิด drawer"
          />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] overflow-y-auto border-r border-border bg-background shadow-xl">
            <div className="flex items-center justify-between border-b px-3 py-2">
              <span className="font-display text-sm font-semibold tracking-tight">
                Labs
              </span>
              <Button
                size="icon-sm"
                variant="ghost"
                className="cursor-pointer"
                onClick={() => setDrawerOpen(false)}
                aria-label="ปิด"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
            {loading ? (
              <SidebarSkeleton />
            ) : index ? (
              <StackSidebar
                index={index}
                currentStack={currentStack}
                currentLabKey={currentLabKey}
                onNavigate={() => setDrawerOpen(false)}
              />
            ) : null}
          </div>
        </div>
      )}

      {/* Main content */}
      <div className={cn('flex-1 min-w-0', toc ? 'xl:flex xl:gap-8' : '')}>
        <div className={cn('px-4 py-8 sm:px-8', toc ? 'xl:flex-1 xl:min-w-0' : '')}>
          {children}
        </div>

        {/* TOC — desktop xl+ only */}
        {toc && (
          <aside
            className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-56 shrink-0 overflow-y-auto py-8 pr-6 xl:block"
            aria-label="Table of contents"
          >
            {toc}
          </aside>
        )}
      </div>
    </div>
  )
}

// -------------------- helpers --------------------

function SidebarSkeleton() {
  return (
    <div className="flex flex-col gap-2 p-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="space-y-1.5">
          <Skeleton className="h-6 w-32" />
          <div className="space-y-1 pl-6">
            {[...Array(3)].map((_, j) => (
              <Skeleton key={j} className="h-4 w-40" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function SidebarError({ message }: { message: string }) {
  return (
    <div className="p-4 text-sm text-destructive">
      <p className="font-medium">โหลด lab list ไม่สำเร็จ</p>
      <p className="mt-1 text-xs text-muted-foreground">{message}</p>
    </div>
  )
}
