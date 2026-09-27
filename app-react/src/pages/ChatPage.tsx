import { useEffect, useRef, useState } from "react"
import { streamChat, type ChatRequestMessage } from "../api"
import type { ChatMessage, ModelConfig, Session } from "../types"
import { now, uid } from "../store"
import { makeT, type Lang } from "../i18n"
import { Markdown } from "../components/Markdown"

interface ChatPageProps {
  session: Session
  model: ModelConfig | undefined
  systemPrompt: string
  lang: Lang
  initialDraft?: string
  onDraftConsumed?: () => void
  onUpdateSession: (session: Session) => void
  onSelectModel: () => void
  onBack: () => void
}

export default function ChatPage(props: ChatPageProps) {
  const { session } = props
  const t = makeT(props.lang)
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

  // 挂载时消费预填草稿（从代码文件插入）
  useEffect(() => {
    if (props.initialDraft) {
      setInput(props.initialDraft)
      props.onDraftConsumed?.()
      inputRef.current?.focus()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
      setError(t("chat.noModelError"))
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
      // 流式累积器：避免回调闭包使用旧快照导致内容/思考/工具丢失
      let accContent = ""
      let accReasoning = ""
      let accToolCalls: string[] = []
      const push = () => {
        const cur = withAssistant
        const last = cur.messages[cur.messages.length - 1]
        const nextMessages = [
          ...cur.messages.slice(0, -1),
          {
            ...last,
            content: accContent,
            reasoning: accReasoning || undefined,
            toolCalls: accToolCalls.length > 0 ? accToolCalls : undefined,
          },
        ]
        props.onUpdateSession({ ...cur, messages: nextMessages })
      }
      const full = await streamChat({
        baseURL: props.model.baseURL,
        apiKey: props.model.apiKey,
        modelId: props.model.modelId,
        messages: requestMessages,
        signal: abort.signal,
        onDelta: (delta) => {
          accContent += delta
          push()
        },
        onReasoning: (delta) => {
          accReasoning += delta
          push()
        },
        onToolCall: (name) => {
          accToolCalls = [...new Set([...accToolCalls, name])]
          push()
        },
      })
      if (full) {
        // final sync（幂等）
        accContent = full
        const cur = withAssistant
        const last = cur.messages[cur.messages.length - 1]
        props.onUpdateSession({
          ...cur,
          messages: [...cur.messages.slice(0, -1), { ...last, content: accContent, reasoning: accReasoning || undefined, toolCalls: accToolCalls.length > 0 ? accToolCalls : undefined }],
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
          aria-label={t("chat.back")}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-semibold text-gray-900">{session.title}</div>
          <div className="truncate text-[11px] text-gray-400">{props.model ? props.model.name : t("chat.selectModel")}</div>
        </div>
        <button
          onClick={props.onSelectModel}
          className="flex shrink-0 items-center gap-1 rounded-full bg-black/5 px-3 py-1.5 text-[12px] font-medium text-gray-700 transition-colors active:bg-black/10"
        >
          <span className="max-w-[90px] truncate">{props.model ? props.model.modelId : t("chat.selectModel")}</span>
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
              <div className="text-[15px] font-medium text-gray-800">{t("chat.empty.title")}</div>
              <div className="max-w-[260px] text-[13px] leading-5 text-gray-400">{t("chat.empty.desc")}</div>
            </div>
          )}
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[86%] break-words rounded-2xl px-4 py-2.5 ${
                  m.role === "user"
                    ? "rounded-br-md bg-black text-white"
                    : m.error
                      ? "rounded-bl-md border border-red-200 bg-red-50 text-red-600"
                      : "rounded-bl-md border border-black/5 bg-[#f2f3f5]"
                }`}
              >
                {/* 思考过程折叠卡片 */}
                {m.role === "assistant" && m.reasoning && <ReasoningBlock text={m.reasoning} lang={props.lang} />}
                {/* 工具调用卡片 */}
                {m.role === "assistant" && m.toolCalls && m.toolCalls.length > 0 && (
                  <div className="mb-1.5 flex flex-wrap gap-1">
                    {m.toolCalls.map((name) => (
                      <span
                        key={name}
                        className="flex items-center gap-1 rounded-full border border-[#0e7490]/25 bg-[#0e7490]/[0.07] px-2 py-0.5 text-[11px] text-[#0e7490]"
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
                        </svg>
                        {name}
                      </span>
                    ))}
                  </div>
                )}
                {/* 内容：Markdown（助手有内容时）/ 纯文本 */}
                {m.role === "user" ? (
                  <div className="whitespace-pre-wrap text-[14px] leading-6">{m.content}</div>
                ) : (
                  <div className={m.error ? "text-[13px]" : "markdown-host"}>
                    {m.error ? (
                      <span className="whitespace-pre-wrap text-[13px]">{m.content}</span>
                    ) : (
                      <Markdown content={m.content} />
                    )}
                  </div>
                )}
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
              placeholder={props.model ? t("chat.placeholder") : t("chat.placeholder.noModel")}
              rows={Math.min(6, Math.max(1, Math.ceil(input.length / 48)))}
              className="max-h-[160px] w-full resize-none bg-transparent text-[14px] leading-5 text-gray-800 outline-none placeholder:text-gray-400"
            />
          </div>
          {streaming ? (
            <button
              onClick={stop}
              className="flex size-11 shrink-0 items-center justify-center rounded-full bg-black text-white shadow-sm transition-transform active:scale-95"
              aria-label={t("chat.stop")}
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
              aria-label={t("chat.send")}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 19V5M12 5l-6 6M12 5l6 6" />
              </svg>
            </button>
          )}
        </div>
        <div className="mx-auto mt-2 max-w-[760px] text-center text-[10px] text-gray-400">
          {t("chat.disclaimer")}
        </div>
      </div>
    </div>
  )
}

/** 思考过程折叠卡片（reasoning） */
function ReasoningBlock({ text, lang }: { text: string; lang: Lang }) {
  const t = makeT(lang)
  const [open, setOpen] = useState(false)
  return (
    <div className="mb-1.5 overflow-hidden rounded-lg border border-amber-200/70 bg-amber-50/60">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium text-amber-700"
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          className={`shrink-0 transition-transform ${open ? "rotate-90" : ""}`}
        >
          <path d="M9 18l6-6-6-6" />
        </svg>
        {t("chat.reasoning")}
        <span className="ml-auto text-amber-500/80">{open ? t("chat.reasoning.collapse") : t("chat.reasoning.expand")}</span>
      </button>
      {open && (
        <div className="max-h-[40vh] overflow-y-auto whitespace-pre-wrap border-t border-amber-100 px-3 py-2 text-[11.5px] leading-5 text-amber-800/90">
          {text}
        </div>
      )}
    </div>
  )
}
