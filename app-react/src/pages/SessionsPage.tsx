import { useMemo, useState } from "react"
import type { ModelConfig, Session } from "../types"
import { makeT, type Lang, type T } from "../i18n"

interface SessionsPageProps {
  sessions: Session[]
  models: ModelConfig[]
  lang: Lang
  onCreateSession: () => void
  onOpenSession: (id: string) => void
  onRenameSession: (id: string, title: string) => void
  onDeleteSession: (id: string) => void
}

function groupLabel(ts: number, t: T): string {
  const d = new Date(ts)
  const today = new Date()
  const yesterday = new Date(today.getTime() - 86400000)
  if (d.toDateString() === today.toDateString()) return t("sessions.today")
  if (d.toDateString() === yesterday.toDateString()) return t("sessions.yesterday")
  return t("sessions.older")
}

export default function SessionsPage(props: SessionsPageProps) {
  const t = makeT(props.lang)
  const [query, setQuery] = useState("")
  const [renameTarget, setRenameTarget] = useState<Session | null>(null)
  const [renameValue, setRenameValue] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<Session | null>(null)

  const groups = useMemo(() => {
    const filtered = props.sessions
      .filter((s) => !query || s.title.toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => b.updatedAt - a.updatedAt)
    const map = new Map<string, Session[]>()
    for (const s of filtered) {
      const key = groupLabel(s.updatedAt, t)
      map.set(key, [...(map.get(key) ?? []), s])
    }
    return [...map.entries()]
  }, [props.sessions, query, t])

  const modelName = (id: string) => props.models.find((m) => m.id === id)?.name ?? ""

  return (
    <div className="flex h-full flex-col bg-white">
      {/* 顶栏 */}
      <div className="border-b border-black/5 px-4 pb-2 pt-[max(env(safe-area-inset-top),14px)]">
        <div className="mb-3 text-[22px] font-bold text-gray-900">{t("sessions.title")}</div>
        <div className="flex items-center gap-2 rounded-[10px] border border-black/5 bg-[#f7f7f8] px-3 py-2 focus-within:bg-white">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="shrink-0 text-gray-400">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("sessions.search")}
            className="w-full bg-transparent text-[14px] outline-none placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* 会话列表 */}
      <div className="flex-1 overflow-y-auto px-3 pb-20">
        {groups.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-20 text-center">
            <div className="text-[14px] font-medium text-gray-700">{query ? t("sessions.empty.search") : t("sessions.empty.title")}</div>
            <div className="max-w-[240px] text-[13px] leading-5 text-gray-400">
              {query ? t("sessions.empty.searchDesc") : t("sessions.empty.desc")}
            </div>
          </div>
        )}
        {groups.map(([label, list]) => (
          <div key={label} className="mb-4">
            <div className="mb-1.5 px-1 text-[12px] font-medium text-gray-400">{label}</div>
            {list.map((s) => (
              <div
                key={s.id}
                onClick={() => props.onOpenSession(s.id)}
                className="group mb-0.5 flex min-h-[52px] cursor-pointer items-center gap-3 rounded-xl px-3 transition-colors active:bg-black/5"
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-gradient-to-br from-[#0ea5e9] to-[#6366f1] text-[13px] font-bold text-white">
                  {s.title.slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] font-medium text-gray-900">{s.title}</div>
                  <div className="truncate text-[11px] text-gray-400">
                    {modelName(s.modelId)} · {s.messages.length} {t("sessions.messages")}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-active:opacity-100">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setRenameTarget(s)
                      setRenameValue(s.title)
                    }}
                    className="flex size-8 items-center justify-center rounded-full text-gray-500 active:bg-black/5"
                    aria-label="重命名"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M17 3a2.8 2.8 0 113.99 4L9 19l-4 1 1-4L17 3z" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setDeleteTarget(s)
                    }}
                    className="flex size-8 items-center justify-center rounded-full text-gray-500 active:bg-red-50 active:text-red-500"
                    aria-label="删除"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* 重命名对话框 */}
      {renameTarget && (
        <ModalShell title={t("sessions.rename")} onClose={() => setRenameTarget(null)}>
          <input
            autoFocus
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && renameValue.trim()) {
                props.onRenameSession(renameTarget.id, renameValue.trim())
                setRenameTarget(null)
              }
            }}
            placeholder={t("sessions.rename.placeholder")}
            className="w-full rounded-[10px] border border-black/10 bg-white px-3 py-2.5 text-[14px] outline-none focus:border-black/30"
          />
          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={() => setRenameTarget(null)}
              className="rounded-full px-4 py-2 text-[13px] font-medium text-gray-600 active:bg-black/5"
            >
              {t("common.cancel")}
            </button>
            <button
              onClick={() => {
                if (renameValue.trim()) {
                  props.onRenameSession(renameTarget.id, renameValue.trim())
                  setRenameTarget(null)
                }
              }}
              className="rounded-full bg-black px-4 py-2 text-[13px] font-medium text-white active:opacity-80"
            >
              {t("common.save")}
            </button>
          </div>
        </ModalShell>
      )}

      {/* 删除确认对话框 */}
      {deleteTarget && (
        <ModalShell title={t("sessions.delete")} onClose={() => setDeleteTarget(null)}>
          <p className="text-[13px] leading-5 text-gray-500">
            {t("sessions.delete.confirm", { title: deleteTarget.title })}
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={() => setDeleteTarget(null)}
              className="rounded-full px-4 py-2 text-[13px] font-medium text-gray-600 active:bg-black/5"
            >
              {t("common.cancel")}
            </button>
            <button
              onClick={() => {
                props.onDeleteSession(deleteTarget.id)
                setDeleteTarget(null)
              }}
              className="rounded-full bg-red-500 px-4 py-2 text-[13px] font-medium text-white active:opacity-80"
            >
              {t("common.delete")}
            </button>
          </div>
        </ModalShell>
      )}
    </div>
  )
}

function ModalShell(props: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={props.onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[420px] rounded-t-2xl bg-white p-5 pb-[max(env(safe-area-inset-bottom),20px)] sm:rounded-2xl"
      >
        <div className="mb-4 text-[16px] font-semibold text-gray-900">{props.title}</div>
        {props.children}
      </div>
    </div>
  )
}
