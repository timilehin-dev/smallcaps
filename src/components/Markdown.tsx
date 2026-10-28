import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

// Images are only allowed from our own Vercel Blob store; everything else renders as alt text.
const IMG_OK = /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//i

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
