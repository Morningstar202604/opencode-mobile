import { useEffect, useRef, useState } from "react"
import { streamChat, type ChatRequestMessage } from "../api"
import type { ChatMessage, ModelConfig, Session } from "../types"
import { now, uid } from "../store"

interface ChatPageProps {
  session: Session
  model: ModelConfig | undefined
  systemPrompt: string
  onUpdateSession: (session: Session) => void
  onSelectModel: () => void
  onBack: () => void
}

export default function ChatPage(props: ChatPageProps) {
  const { session } = props
  const [input, setInput] = useState("")
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const messages = session.messages

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, streaming])

  const scrollToBottom = () => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }

  const buildRequestMessages = (): ChatRequestMessage[] => {
    const list: ChatRequestMessage[] = []
    if (props.systemPrompt.trim()) list.push({ role: "system", content: props.systemPrompt.trim() })
    for (const m of messages) {
      if (m.error) continue
      list.push({ role: m.role, content: m.content })
    }
    return list
  }

  const send = async () => {
    const text = input.trim()
    if (!text || streaming) return
    if (!props.model) {
      setError("请先在「我的 → 模型管理」添加并选择一个模型")
      return
    }
    const userMsg: ChatMessage = { id: uid("m"), role: "user", content: text, createdAt: now() }
    const updated = { ...session, messages: [...messages, userMsg], updatedAt: now() }
    if (updated.title === "新对话") {
      updated.title = text.slice(0, 24)
    }
    props.onUpdateSession(updated)
    setInput("")
    setError(null)
    setStreaming(true)

    const abort = new AbortController()
    abortRef.current = abort
    const assistantMsg: ChatMessage = { id: uid("m"), role: "assistant", content: "", createdAt: now() }
    const withAssistant = { ...updated, messages: [...updated.messages, assistantMsg] }
    props.onUpdateSession(withAssistant)

    try {
      const requestMessages = [...buildRequestMessages(), { role: "user" as const, content: text }]
      const full = await streamChat({
        baseURL: props.model.baseURL,
        apiKey: props.model.apiKey,
        modelId: props.model.modelId,
        messages: requestMessages,
        signal: abort.signal,
        onDelta: (delta) => {
          const cur = withAssistant
          const last = cur.messages[cur.messages.length - 1]
          const nextMessages = [...cur.messages.slice(0, -1), { ...last, content: last.content + delta }]
          props.onUpdateSession({ ...cur, messages: nextMessages })
        },
      })
      if (full) {
        // final sync (idempotent)
        const cur = withAssistant
        const last = cur.messages[cur.messages.length - 1]
        props.onUpdateSession({
          ...cur,
          messages: [...cur.messages.slice(0, -1), { ...last, content: full }],
          updatedAt: now(),
        })
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg)
      const cur = withAssistant
      const last = cur.messages[cur.messages.length - 1]
      if (!last.content) {
        props.onUpdateSession({
          ...cur,
          messages: [...cur.messages.slice(0, -1), { ...last, content: `（生成失败：${msg}）`, error: true }],
        })
      }
    } finally {
      setStreaming(false)
      abortRef.current = null
      inputRef.current?.focus()
      scrollToBottom()
    }
  }

  const stop = () => {
    abortRef.current?.abort()
    setStreaming(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      void send()
    }
  }

  return (
    <div className="flex h-full flex-col bg-white">
      {/* 顶栏 */}
      <header className="flex items-center gap-1 border-b border-black/5 px-2 pt-[max(env(safe-area-inset-top),0px)] pb-2">
        <button
          onClick={props.onBack}
          className="flex size-8 shrink-0 items-center justify-center rounded-full text-gray-600 transition-colors active:bg-black/5"
          aria-label="返回"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-semibold text-gray-900">{session.title}</div>
          <div className="truncate text-[11px] text-gray-400">{props.model ? props.model.name : "未选择模型"}</div>
        </div>
        <button
          onClick={props.onSelectModel}
          className="flex shrink-0 items-center gap-1 rounded-full bg-black/5 px-3 py-1.5 text-[12px] font-medium text-gray-700 transition-colors active:bg-black/10"
        >
          <span className="max-w-[90px] truncate">{props.model ? props.model.modelId : "选择模型"}</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      </header>

      {/* 消息流 */}
      <div ref={scrollRef} className="chat-scroll flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-[760px] flex-col gap-4 px-4 py-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <div className="text-[15px] font-medium text-gray-800">开始对话</div>
              <div className="max-w-[260px] text-[13px] leading-5 text-gray-400">
                选择模型后输入消息，即可开始。支持多轮对话与停止生成。
              </div>
            </div>
          )}
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[86%] whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-[14px] leading-6 ${
                  m.role === "user"
                    ? "rounded-br-md bg-black text-white"
                    : m.error
                      ? "rounded-bl-md border border-red-200 bg-red-50 text-red-600"
                      : "rounded-bl-md border border-black/5 bg-[#f2f3f5] text-gray-800"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          {streaming && (
            <div className="flex justify-start">
              <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-black/5 bg-[#f2f3f5] px-4 py-3">
                <span className="typing-dot size-1.5 rounded-full bg-gray-400" />
                <span className="typing-dot size-1.5 rounded-full bg-gray-400" />
                <span className="typing-dot size-1.5 rounded-full bg-gray-400" />
              </div>
            </div>
          )}
          {error && !streaming && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-600">{error}</div>
          )}
        </div>
      </div>

      {/* 输入区 */}
      <div className="border-t border-black/5 bg-white px-3 pb-[max(env(safe-area-inset-bottom),12px)] pt-2">
        <div className="mx-auto flex max-w-[760px] items-end gap-2">
          <div className="min-h-[44px] flex-1 rounded-[22px] border border-black/10 bg-[#f7f7f8] px-4 py-2.5 transition-colors focus-within:border-black/20 focus-within:bg-white">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={props.model ? "输入消息…" : "请先选择模型"}
              rows={Math.min(6, Math.max(1, Math.ceil(input.length / 48)))}
              className="max-h-[160px] w-full resize-none bg-transparent text-[14px] leading-5 text-gray-800 outline-none placeholder:text-gray-400"
            />
          </div>
          {streaming ? (
            <button
              onClick={stop}
              className="flex size-11 shrink-0 items-center justify-center rounded-full bg-black text-white shadow-sm transition-transform active:scale-95"
              aria-label="停止生成"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            </button>
          ) : (
            <button
              onClick={() => void send()}
              disabled={!input.trim() || !props.model}
              className="flex size-11 shrink-0 items-center justify-center rounded-full bg-black text-white shadow-sm transition-all active:scale-95 disabled:opacity-30 disabled:active:scale-100"
              aria-label="发送"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 19V5M12 5l-6 6M12 5l6 6" />
              </svg>
            </button>
          )}
        </div>
        <div className="mx-auto mt-2 max-w-[760px] text-center text-[10px] text-gray-400">
          内容由所选模型生成，请核对关键信息
        </div>
      </div>
    </div>
  )
}
