export interface ModelConfig {
  id: string
  name: string
  baseURL: string
  apiKey: string
  modelId: string
  systemPrompt?: string
  createdAt: number
}

export interface Role {
  id: string
  name: string
  prompt: string
  builtin?: boolean
}

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  createdAt: number
  error?: boolean
  /** 思考过程（reasoning_content，如 DeepSeek 风格） */
  reasoning?: string
  /** 工具调用摘要列表（名称 + 参数摘要） */
  toolCalls?: string[]
}

export interface Session {
  id: string
  title: string
  createdAt: number
  updatedAt: number
  modelId: string
  messages: ChatMessage[]
}

export interface Settings {
  language: "zh" | "en"
  defaultModelId?: string
  activeRoleId?: string
  globalPrompt?: string
}
