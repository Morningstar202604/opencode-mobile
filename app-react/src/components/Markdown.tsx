import { memo } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { CodeBlock } from "./CodeBlock"

/** 助手消息 Markdown 渲染（GFM + 代码高亮） */
export const Markdown = memo(function Markdown({ content }: { content: string }) {
  return (
    <div className="markdown-body text-[14px] leading-6 text-gray-800">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code: (props) => <CodeBlock {...props} />,
          a: ({ children, ...props }) => (
            <a {...props} target="_blank" rel="noreferrer" className="text-[#0e7490] underline underline-offset-2">
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="my-2 overflow-x-auto rounded-lg border border-black/10">
              <table className="w-full border-collapse text-[13px]">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border-b border-black/10 bg-black/[0.03] px-2.5 py-1.5 text-left font-semibold">{children}</th>
          ),
          td: ({ children }) => <td className="border-b border-black/5 px-2.5 py-1.5">{children}</td>,
          h1: ({ children }) => <h1 className="mb-2 mt-3 text-[18px] font-bold">{children}</h1>,
          h2: ({ children }) => <h2 className="mb-2 mt-3 text-[16px] font-bold">{children}</h2>,
          h3: ({ children }) => <h3 className="mb-1.5 mt-2.5 text-[15px] font-semibold">{children}</h3>,
          ul: ({ children }) => <ul className="my-1.5 list-disc space-y-1 pl-5">{children}</ul>,
          ol: ({ children }) => <ol className="my-1.5 list-decimal space-y-1 pl-5">{children}</ol>,
          li: ({ children }) => <li className="leading-6">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="my-2 border-l-[3px] border-black/15 pl-3 text-gray-500">{children}</blockquote>
          ),
          hr: () => <hr className="my-3 border-black/10" />,
          p: ({ children }) => <p className="my-1.5">{children}</p>,
          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
          input: ({ ...props }) => <input {...props} disabled />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
})
