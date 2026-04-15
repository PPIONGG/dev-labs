import { useEffect } from 'react'

/**
 * Set document.title — restore เมื่อ component unmount
 *
 * Usage: useDocumentTitle('Login · Dev Labs')
 */
export function useDocumentTitle(title: string) {
  useEffect(() => {
    const previous = document.title
    document.title = title
    return () => {
      document.title = previous
    }
  }, [title])
}
