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
}

/**
 * OpenAI 兼容流式聊天（SSE）。
 * 返回完整回复文本；错误时抛出带信息的 Error。
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
        const delta = json.choices?.[0]?.delta?.content
        if (typeof delta === "string" && delta) {
          full += delta
          opts.onDelta(delta)
        }
      } catch {
        // ignore malformed keep-alive frames
      }
    }
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
