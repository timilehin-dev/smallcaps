import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

// Images are only allowed from our own Vercel Blob store; everything else renders as alt text.
import { MEDIA_FILE_RE } from '@/lib/media'
// Serve images through the public /media-file reader, or accept the blob host
// directly if a store is configured public. Markdown's media URLs are relative
// (/media-file/...) so they work on any domain without SITE_URL.
const IMG_OK = MEDIA_FILE_RE

export function Markdown({ source }: { source: string }) {
  return (
    <div className="prose prose-neutral max-w-none prose-headings:tracking-tight prose-a:text-accent prose-img:rounded-lg">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        skipHtml
        components={{
          a: ({ href, children }) => {
            const external = !!href && /^https?:\/\//i.test(href)
            return (
              <a href={href} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
                {children}
              </a>
            )
          },
          img: ({ src, alt }) =>
            typeof src === 'string' && IMG_OK.test(src) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={src} alt={alt ?? ''} loading="lazy" />
            ) : (
              <span>{alt}</span>
            ),
          table: ({ children }) => (
            <div className="overflow-x-auto">
              <table>{children}</table>
            </div>
          ),
        }}
      >
        {source}
      </ReactMarkdown>
    </div>
  )
}
