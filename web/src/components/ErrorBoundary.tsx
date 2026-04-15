import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RotateCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface State {
  error: Error | null
}

/**
 * จับ runtime error ใน React tree → แสดง fallback UI แทน white screen
 *
 * Usage: <ErrorBoundary><App /></ErrorBoundary>
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Log to console — production: ส่งไป Sentry/Logflare
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  handleReset = () => {
    this.setState({ error: null })
    // Hard reload: clear any bad state
    window.location.reload()
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12 text-center">
          <div
            className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive ring-1 ring-destructive/30"
            aria-hidden="true"
          >
            <AlertTriangle className="h-7 w-7" />
          </div>

          <div className="mb-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
            // unexpected error
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            มีอะไรผิดพลาด
          </h1>
          <p className="mt-3 max-w-md text-muted-foreground">
            เกิด error ใน app — ลองรีโหลดหน้า ถ้ายังไม่หายช่วยส่ง screenshot ให้เราด้วย
          </p>

          {import.meta.env.DEV && (
            <pre className="mt-6 max-w-2xl overflow-auto rounded-lg border bg-muted/40 p-4 text-left font-mono text-xs">
              {this.state.error.message}
              {this.state.error.stack && '\n\n' + this.state.error.stack}
            </pre>
          )}

          <Button onClick={this.handleReset} className="mt-6 cursor-pointer">
            <RotateCw className="h-4 w-4" aria-hidden="true" />
            รีโหลดหน้า
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}
