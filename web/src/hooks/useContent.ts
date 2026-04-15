import { useEffect, useState } from 'react'
import {
  loadContentIndex,
  loadLabMarkdown,
  type ContentIndex,
} from '@/lib/content'

interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: Error | null
}

/** Hook สำหรับโหลด content index (สารบัญ labs ทั้งหมด) — cached singleton */
export function useContentIndex(): AsyncState<ContentIndex> {
  const [state, setState] = useState<AsyncState<ContentIndex>>({
    data: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    let cancelled = false
    loadContentIndex()
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null })
      })
      .catch((err) => {
        if (!cancelled) setState({ data: null, loading: false, error: err })
      })
    return () => {
      cancelled = true
    }
  }, [])

  return state
}

/** Hook สำหรับโหลด markdown ของ lab — re-fetch เมื่อ path เปลี่ยน */
export function useLabMarkdown(path: string | null | undefined): AsyncState<string> {
  const [state, setState] = useState<AsyncState<string>>({
    data: null,
    loading: !!path,
    error: null,
  })

  useEffect(() => {
    if (!path) {
      setState({ data: null, loading: false, error: null })
      return
    }
    let cancelled = false
    setState({ data: null, loading: true, error: null })
    loadLabMarkdown(path)
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null })
      })
      .catch((err) => {
        if (!cancelled) setState({ data: null, loading: false, error: err })
      })
    return () => {
      cancelled = true
    }
  }, [path])

  return state
}
