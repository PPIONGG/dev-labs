import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import 'highlight.js/styles/github-dark.css'
import { cn } from '@/lib/utils'

interface Props {
  children: string
  className?: string
}

/**
 * Markdown renderer
 * - GFM (tables, strikethrough, task list)
 * - Code syntax highlight ผ่าน highlight.js
 * - Heading anchor link (slug + auto-link)
 *
 * Style ผ่าน Tailwind utility classes ตรงๆ — เพราะใช้ shadcn theme
 * ไม่ใช้ @tailwindcss/typography (จะคุมยากกว่า)
 */
export function Markdown({ children, className }: Props) {
  return (
    <div className={cn('prose-content', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          rehypeSlug,
          [rehypeAutolinkHeadings, { behavior: 'wrap' }],
          rehypeHighlight,
        ]}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}
