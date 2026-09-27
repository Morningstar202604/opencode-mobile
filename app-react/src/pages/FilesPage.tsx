import { useEffect, useState } from "react"
import { listCodeFiles, saveCodeFile, deleteCodeFile, filesNative, type CodeFile } from "../files"
import { useT } from "../i18n"

interface FilesPageProps {
  onInsertFile: (name: string, content: string) => void
}

type View = "list" | "editor"

export default function FilesPage(props: FilesPageProps) {
  const t = useT()
  const [files, setFiles] = useState<CodeFile[]>([])
  const [view, setView] = useState<View>("list")
  const [editing, setEditing] = useState<CodeFile | null>(null)
  const [name, setName] = useState("")
  const [content, setContent] = useState("")
  const [toast, setToast] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const refresh = async () => {
    setFiles(await listCodeFiles())
  }
  useEffect(() => {
    void refresh()
  }, [])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2000)
  }

  const openEditor = (f: CodeFile | null) => {
    if (f) {
      setEditing(f)
      setName(f.name)
      setContent(f.content)
    } else {
      setEditing(null)
      setName("")
      setContent("")
    }
    setView("editor")
  }

  const doSave = async () => {
    const n = name.trim()
    if (!n) {
      showToast(t("files.nameRequired"))
      return
    }
    await saveCodeFile({ name: n, content, updatedAt: Date.now() })
    setView("list")
    void refresh()
    showToast(`已保存 ${n}`)
  }

  const doDelete = async (n: string) => {
    await deleteCodeFile(n)
    setConfirmDelete(null)
    void refresh()
    showToast(`已删除 ${n}`)
  }

  const doInsert = (f: CodeFile) => {
    props.onInsertFile(f.name, f.content)
    showToast(`已插入「${f.name}」的内容`)
  }

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="border-b border-black/5 px-4 pb-2 pt-[max(env(safe-area-inset-top),14px)]">
        <div className="mb-1 text-[22px] font-bold text-gray-900">代码文件</div>
        <div className="text-[11px] text-gray-400">
          {filesNative() ? t("files.desc") : t("files.descWeb")} · {t("files.tagline")}
        </div>
      </div>

      {view === "list" ? (
        <>
          <div className="flex-1 overflow-y-auto px-4 pb-20">
            {files.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-16 text-center">
                <div className="text-[14px] font-medium text-gray-700">{t("files.empty.title")}</div>
                <div className="max-w-[250px] text-[13px] leading-5 text-gray-400">{t("files.empty.desc")}</div>
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              {files.map((f) => (
                <div
                  key={f.name}
                  className="flex min-h-[52px] items-center gap-3 rounded-xl border border-black/8 bg-white px-3.5 py-2.5 active:bg-black/[0.03]"
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-gradient-to-br from-emerald-500 to-teal-600 font-mono text-[13px] font-bold text-white">
                    {ext(f.name)}
                  </div>
                  <div className="min-w-0 flex-1" onClick={() => openEditor(f)}>
                    <div className="truncate font-mono text-[14px] font-medium text-gray-900">{f.name}</div>
                    <div className="truncate text-[11px] text-gray-400">{f.content.length} 字符</div>
                  </div>
                  <button
                    onClick={() => doInsert(f)}
                    className="rounded-full bg-black/5 px-2.5 py-1.5 text-[11px] font-medium text-gray-700 active:bg-black/10"
                  >
                    插入聊天
                  </button>
                  <button
                    onClick={() => setConfirmDelete(f.name)}
                    className="flex size-8 shrink-0 items-center justify-center rounded-full text-gray-400 active:bg-red-50 active:text-red-500"
                    aria-label={t("files.delete")}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="border-t border-black/5 bg-white px-4 pb-[max(env(safe-area-inset-bottom),10px)] pt-2">
            <button
              onClick={() => openEditor(null)}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-black py-3 text-[14px] font-medium text-white active:opacity-80"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              新建文件
            </button>
          </div>
        </>
      ) : (
        <div className="flex h-full flex-col">
          <div className="flex items-center gap-2 border-b border-black/5 px-3 py-2">
            <button
              onClick={() => {
                setView("list")
                void refresh()
              }}
              className="flex size-8 shrink-0 items-center justify-center rounded-full text-gray-600 active:bg-black/5"
              aria-label={t("files.back")}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("files.placeholder")}
              className="min-w-0 flex-1 rounded-lg border border-black/10 bg-white px-3 py-1.5 font-mono text-[14px] outline-none focus:border-black/30"
            />
            <button
              onClick={() => void doSave()}
              className="shrink-0 rounded-full bg-black px-4 py-1.5 text-[13px] font-medium text-white active:opacity-80"
            >
              保存
            </button>
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t("files.editorPlaceholder")}
            spellCheck={false}
            className="flex-1 resize-none bg-white p-4 font-mono text-[13px] leading-5 text-gray-800 outline-none"
          />
        </div>
      )}

      {/* 删除确认 */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={() => setConfirmDelete(null)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[420px] rounded-t-2xl bg-white p-5 pb-[max(env(safe-area-inset-bottom),20px)] sm:rounded-2xl"
          >
            <div className="mb-3 text-[16px] font-semibold text-gray-900">删除文件</div>
            <p className="text-[13px] leading-5 text-gray-500">
              删除「{confirmDelete}」后不可恢复，确认删除？
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="rounded-full px-4 py-2 text-[13px] font-medium text-gray-600 active:bg-black/5"
              >
                取消
              </button>
              <button
                onClick={() => void doDelete(confirmDelete)}
                className="rounded-full bg-red-500 px-4 py-2 text-[13px] font-medium text-white active:opacity-80"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center">
          <div className="rounded-full bg-black/85 px-4 py-2 text-[12px] text-white">{toast}</div>
        </div>
      )}
    </div>
  )
}

function ext(name: string): string {
  const dot = name.lastIndexOf(".")
  return dot > 0 ? name.slice(dot + 1, dot + 4).toUpperCase() : "TXT"
}
