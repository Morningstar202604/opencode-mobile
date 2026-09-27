export interface ChatRequestMessage {
  role: "system" | "user" | "assistant"
  content: string
}

export interface StreamChatOptions {
  baseURL: string
  apiKey: string
  modelId: string
  messages: ChatRequestMessage[]
  signal?: AbortSignal
  onDelta: (delta: string) => void
  onReasoning?: (delta: string) => void
  onToolCall?: (summary: string) => void
}

/**
 * OpenAI 兼容流式聊天（SSE）。
 * 返回完整回复文本；错误时抛出带信息的 Error。
 * 额外解析 reasoning_content（思考过程）与 tool_calls（工具调用）。
 */
export async function streamChat(opts: StreamChatOptions): Promise<string> {
  const base = opts.baseURL.replace(/\/+$/, "")
  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${opts.apiKey}`,
    },
    body: JSON.stringify({
      model: opts.modelId,
      messages: opts.messages,
      stream: true,
    }),
    signal: opts.signal,
  })
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`HTTP ${res.status}${body ? `: ${body.slice(0, 160)}` : ""}`)
  }
  const reader = res.body?.getReader()
  if (!reader) throw new Error("响应不支持流式读取")

  let full = ""
  let buffer = ""
  let toolIndex = -1
  let toolName = ""
  const decoder = new TextDecoder()
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split("\n")
    buffer = lines.pop() ?? ""
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed.startsWith("data:")) continue
      const payload = trimmed.slice(5).trim()
      if (payload === "[DONE]") continue
      try {
        const json = JSON.parse(payload)
        const choice = json.choices?.[0]
        const delta = choice?.delta ?? {}

        // 1) 正常文本
        const content = delta.content
        if (typeof content === "string" && content) {
          full += content
          opts.onDelta(content)
        }

        // 2) 思考过程（DeepSeek / Qwen 等 reasoning_content）
        const reasoning = delta.reasoning_content
        if (typeof reasoning === "string" && reasoning) {
          opts.onReasoning?.(reasoning)
        }

        // 3) 工具调用（tool_calls 流式分片）
        const calls = delta.tool_calls
        if (Array.isArray(calls)) {
          for (const call of calls) {
            const idx = call.index ?? 0
            if (idx !== toolIndex) {
              if (toolIndex >= 0 && toolName) {
                opts.onToolCall?.(toolName)
              }
              toolIndex = idx
              toolName = call.function?.name ?? ""
            }
            if (call.function?.name) toolName = call.function.name
          }
        }
      } catch {
        // ignore malformed keep-alive frames
      }
    }
  }
  if (toolIndex >= 0 && toolName) {
    opts.onToolCall?.(toolName)
  }
  return full
}

export interface TestConnectionResult {
  ok: boolean
  message: string
}

/** 测试模型连接：发一条最小请求确认 baseURL + key + 模型可用 */
export async function testConnection(baseURL: string, apiKey: string, modelId: string): Promise<TestConnectionResult> {
  const base = baseURL.replace(/\/+$/, "")
  try {
    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelId,
        messages: [{ role: "user", content: "hi" }],
        max_tokens: 8,
        stream: false,
      }),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => "")
      return { ok: false, message: `HTTP ${res.status}${body ? `：${body.slice(0, 100)}` : ""}` }
    }
    const json = await res.json().catch(() => null)
    const reply = json?.choices?.[0]?.message?.content
    return { ok: true, message: reply ? `✓ 连接成功，模型响应：${String(reply).slice(0, 60)}` : "✓ 连接成功，模型已响应" }
  } catch (err) {
    return { ok: false, message: `连接失败：${err instanceof Error ? err.message : String(err)}` }
  }
}
