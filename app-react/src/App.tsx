import { useState } from "react"
import type { ModelConfig, Role, Session, Settings } from "./types"
import { loadModels, loadSessions, loadRoles, loadSettings, saveModels, saveSessions, saveRoles, saveSettings, uid, now } from "./store"
import { makeT, TContext } from "./i18n"
import ChatPage from "./pages/ChatPage"
import SessionsPage from "./pages/SessionsPage"
import SettingsPage from "./pages/SettingsPage"
import FilesPage from "./pages/FilesPage"

type View = "sessions" | "chat" | "settings" | "files"

export default function App() {
  const [view, setView] = useState<View>("sessions")
  const [models, setModels] = useState<ModelConfig[]>(() => loadModels())
  const [sessions, setSessions] = useState<Session[]>(() => loadSessions())
  const [roles, setRoles] = useState<Role[]>(() => loadRoles())
  const [settings, setSettings] = useState<Settings>(() => loadSettings())
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [modelPicker, setModelPicker] = useState(false)
  const [initialDraft, setInitialDraft] = useState<string | null>(null)

  const t = makeT(settings.language)

  const activeSession = sessions.find((s) => s.id === activeSessionId) ?? null
  const activeModel = models.find((m) => m.id === (settings.defaultModelId ?? models[0]?.id))
  const activeRole = roles.find((r) => r.id === settings.activeRoleId)

  // 最终 system prompt：全局提示词 + 角色提示词 + 模型专用提示词
  const systemPrompt = [settings.globalPrompt, activeRole?.prompt, activeModel?.systemPrompt]
    .filter((x) => x && x.trim())
    .join("\n\n")

  const updateModels = (list: ModelConfig[]) => {
    setModels(list)
    saveModels(list)
  }
  const updateSessions = (list: Session[]) => {
    setSessions(list)
    saveSessions(list)
  }
  const updateRoles = (list: Role[]) => {
    setRoles(list)
    saveRoles(list)
  }
  const updateSettings = (s: Settings) => {
    setSettings(s)
    saveSettings(s)
  }

  const createSession = (draft?: string) => {
    const s: Session = {
      id: uid("ses"),
      title: t("chat.new"),
      createdAt: now(),
      updatedAt: now(),
      modelId: activeModel?.id ?? "",
      messages: [],
    }
    updateSessions([s, ...sessions])
    setActiveSessionId(s.id)
    setInitialDraft(draft ?? null)
    setView("chat")
  }

  const openSession = (id: string) => {
    setActiveSessionId(id)
    setView("chat")
  }

  const updateSession = (s: Session) => {
    updateSessions(sessions.map((x) => (x.id === s.id ? s : x)))
  }

  const renameSession = (id: string, title: string) => {
    updateSessions(sessions.map((x) => (x.id === id ? { ...x, title } : x)))
  }

  const deleteSession = (id: string) => {
    updateSessions(sessions.filter((x) => x.id !== id))
    if (activeSessionId === id) {
      setActiveSessionId(null)
      setView("sessions")
    }
  }

  const insertFileToChat = (name: string, content: string) => {
    // 新建会话并预填「文件名 + 内容」草稿
    const draft = `请分析以下文件「${name}」：\n\n\`\`\`\n${content.slice(0, 4000)}\n\`\`\``
    createSession(draft)
  }

  return (
    <TContext.Provider value={makeT(settings.language)}>
      <div className="mx-auto flex h-full w-full max-w-[640px] flex-col bg-[#f7f7f8]">
      {view === "chat" && activeSession ? (
        <ChatPage
          session={activeSession}
          model={activeModel}
          systemPrompt={systemPrompt}
          lang={settings.language}
          initialDraft={initialDraft ?? undefined}
          onDraftConsumed={() => setInitialDraft(null)}
          onUpdateSession={updateSession}
          onSelectModel={() => setModelPicker(true)}
          onBack={() => {
            setActiveSessionId(null)
            setView("sessions")
          }}
        />
      ) : (
        <>
          <div className="flex-1 overflow-hidden">
            {view === "sessions" ? (
              <SessionsPage
                sessions={sessions}
                models={models}
                lang={settings.language}
                onCreateSession={() => createSession()}
                onOpenSession={openSession}
                onRenameSession={renameSession}
                onDeleteSession={deleteSession}
              />
            ) : view === "files" ? (
              <FilesPage onInsertFile={insertFileToChat} />
            ) : (
              <SettingsPage
                models={models}
                roles={roles}
                settings={settings}
                lang={settings.language}
                onSaveModels={updateModels}
                onSaveRoles={updateRoles}
                onSaveSettings={updateSettings}
              />
            )}
          </div>
          {/* 底部导航 */}
          <nav className="flex items-center justify-between border-t border-black/5 bg-white px-6 pb-[max(env(safe-area-inset-bottom),10px)] pt-2">
            <TabButton
              active={view === "sessions"}
              onClick={() => setView("sessions")}
              icon={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </svg>
              }
              label={t("tab.chat")}
            />
            <TabButton
              active={view === "files"}
              onClick={() => setView("files")}
              icon={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z" />
                  <path d="M13 2v7h7" />
                </svg>
              }
              label={t("tab.code")}
            />
            <button
              onClick={() => createSession()}
              className="flex size-13 shrink-0 items-center justify-center rounded-full bg-black text-white shadow-lg shadow-black/20 transition-transform active:scale-95"
              aria-label={t("new.chat")}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
            <TabButton
              active={view === "settings"}
              onClick={() => setView("settings")}
              icon={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z" />
                </svg>
              }
              label={t("tab.me")}
            />
          </nav>
        </>
      )}

      {/* 模型选择弹层 */}
      {modelPicker && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={() => setModelPicker(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[420px] rounded-t-2xl bg-white p-5 pb-[max(env(safe-area-inset-bottom),20px)] sm:rounded-2xl"
          >
            <div className="mb-3 text-[16px] font-semibold text-gray-900">{t("chat.selectModel")}</div>
            <div className="flex max-h-[50vh] flex-col gap-1.5 overflow-y-auto">
              {models.length === 0 && (
                <div className="rounded-lg bg-black/[0.03] px-3 py-4 text-center text-[13px] text-gray-500">
                  {t("settings.noModels.title")}，{t("chat.selectModel")}
                </div>
              )}
              {models.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    updateSettings({ ...settings, defaultModelId: m.id })
                    setModelPicker(false)
                  }}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors active:bg-black/5 ${
                    activeModel?.id === m.id ? "bg-black/[0.04]" : ""
                  }`}
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-gradient-to-br from-[#0ea5e9] to-[#6366f1] text-[13px] font-bold text-white">
                    {m.name.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[14px] font-medium text-gray-900">{m.name}</div>
                    <div className="truncate text-[11px] text-gray-400">{m.modelId}</div>
                  </div>
                  {activeModel?.id === m.id && (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      </div>
    </TContext.Provider>
  )
}

function TabButton(props: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button onClick={props.onClick} className="flex flex-col items-center gap-0.5 px-3 py-0.5" aria-label={props.label}>
      <span className={props.active ? "text-black" : "text-gray-400"}>{props.icon}</span>
      <span className={`text-[10px] font-medium ${props.active ? "text-black" : "text-gray-400"}`}>{props.label}</span>
    </button>
  )
}

