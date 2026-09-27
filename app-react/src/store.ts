import type { ModelConfig, Role, Session, Settings } from "./types"

const KEY = {
  models: "ocm.models.v1",
  sessions: "ocm.sessions.v1",
  roles: "ocm.roles.v1",
  settings: "ocm.settings.v1",
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // storage full or unavailable — ignore
  }
}

export const builtinRoles: Role[] = [
  { id: "general", name: "通用助手", prompt: "你是一个乐于助人的 AI 助手，回答准确、简洁、有条理。", builtin: true },
  { id: "coder", name: "程序员", prompt: "你是资深软件工程师。回答代码问题时给出可运行的代码、清晰的解释，并指出潜在风险和边界情况。", builtin: true },
  { id: "analyst", name: "数据分析师", prompt: "你是数据分析师。用数据驱动的方式回答问题，善于拆解指标、因果关系与统计陷阱，输出结构化结论。", builtin: true },
  { id: "writer", name: "写作专家", prompt: "你是专业写作专家。根据用户需求产出结构清晰、语言精准的文稿，注意逻辑、受众与文风。", builtin: true },
  { id: "translator", name: "翻译官", prompt: "你是资深翻译。翻译时保持原意、语气与风格，符合目标语言习惯，必要时给出注释说明。", builtin: true },
]

export function loadModels(): ModelConfig[] {
  return read<ModelConfig[]>(KEY.models, [])
}
export function saveModels(models: ModelConfig[]) {
  write(KEY.models, models)
}

export function loadSessions(): Session[] {
  return read<Session[]>(KEY.sessions, [])
}
export function saveSessions(sessions: Session[]) {
  write(KEY.sessions, sessions)
}

export function loadRoles(): Role[] {
  const custom = read<Role[]>(KEY.roles, [])
  return [...builtinRoles, ...custom]
}
export function saveRoles(roles: Role[]) {
  const custom = roles.filter((r) => !r.builtin)
  write(KEY.roles, custom)
}

export function loadSettings(): Settings {
  return read<Settings>(KEY.settings, { language: "zh" })
}
export function saveSettings(settings: Settings) {
  write(KEY.settings, settings)
}

export function uid(prefix = "id"): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export function now(): number {
  return Date.now()
}
