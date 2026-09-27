import { memo, useState } from "react"
import hljs from "highlight.js/lib/core"
import javascript from "highlight.js/lib/languages/javascript"
import typescript from "highlight.js/lib/languages/typescript"
import python from "highlight.js/lib/languages/python"
import java from "highlight.js/lib/languages/java"
import csharp from "highlight.js/lib/languages/csharp"
import cpp from "highlight.js/lib/languages/cpp"
import css from "highlight.js/lib/languages/css"
import xml from "highlight.js/lib/languages/xml"
import json from "highlight.js/lib/languages/json"
import bash from "highlight.js/lib/languages/bash"
import sql from "highlight.js/lib/languages/sql"
import go from "highlight.js/lib/languages/go"
import rust from "highlight.js/lib/languages/rust"
import php from "highlight.js/lib/languages/php"
import ruby from "highlight.js/lib/languages/ruby"
import markdown from "highlight.js/lib/languages/markdown"
import yaml from "highlight.js/lib/languages/yaml"

hljs.registerLanguage("javascript", javascript)
hljs.registerLanguage("typescript", typescript)
hljs.registerLanguage("js", javascript)
hljs.registerLanguage("ts", typescript)
hljs.registerLanguage("tsx", typescript)
hljs.registerLanguage("jsx", javascript)
hljs.registerLanguage("python", python)
hljs.registerLanguage("py", python)
hljs.registerLanguage("java", java)
hljs.registerLanguage("csharp", csharp)
hljs.registerLanguage("cpp", cpp)
hljs.registerLanguage("c", cpp)
hljs.registerLanguage("css", css)
hljs.registerLanguage("html", xml)
hljs.registerLanguage("xml", xml)
hljs.registerLanguage("json", json)
hljs.registerLanguage("bash", bash)
hljs.registerLanguage("shell", bash)
hljs.registerLanguage("sh", bash)
hljs.registerLanguage("sql", sql)
hljs.registerLanguage("go", go)
hljs.registerLanguage("rust", rust)
hljs.registerLanguage("php", php)
hljs.registerLanguage("ruby", ruby)
hljs.registerLanguage("md", markdown)
hljs.registerLanguage("yaml", yaml)

function highlight(code: string, lang?: string): string {
  if (!lang) return ""
  try {
    return hljs.highlight(code, { language: lang }).value
  } catch {
    return ""
  }
}

export const CodeBlock = memo(function CodeBlock({
  inline,
  className,
  children,
}: {
  inline?: boolean
  className?: string
  children?: React.ReactNode
}) {
  const [copied, setCopied] = useState(false)
  const text = String(children ?? "").replace(/\n$/, "")
  if (inline) {
    return (
      <code className="rounded-[4px] bg-black/[0.07] px-1.5 py-0.5 font-mono text-[0.85em] text-[#d63384]">
        {children}
      </code>
    )
  }
  const match = /language-(\w+)/.exec(className || "")
  const lang = match?.[1]
  const html = highlight(text, lang)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard unavailable
    }
  }

  return (
    <div className="group/code relative my-2 overflow-hidden rounded-lg border border-black/10 bg-[#0f1117]">
      <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-3 py-1.5">
        <span className="font-mono text-[11px] text-gray-400">{lang || "code"}</span>
        <button
          onClick={() => void copy()}
          className="rounded px-2 py-0.5 text-[11px] text-gray-400 transition-colors active:bg-white/10 active:text-white"
        >
          {copied ? "✓ 已复制" : "复制"}
        </button>
      </div>
      <pre className="overflow-x-auto p-3">
        {html ? (
          <code className="font-mono text-[12.5px] leading-5 text-gray-100" dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          <code className="font-mono text-[12.5px] leading-5 text-gray-100">{text}</code>
        )}
      </pre>
    </div>
  )
})
