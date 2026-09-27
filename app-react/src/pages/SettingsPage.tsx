import { useState } from "react"
import { testConnection } from "../api"
import type { ModelConfig, Role, Settings } from "../types"
import { now, uid } from "../store"
import { makeT, TContext, useT, type Lang } from "../i18n"

interface SettingsPageProps {
  models: ModelConfig[]
  roles: Role[]
  settings: Settings
  lang: Lang
  onSaveModels: (models: ModelConfig[]) => void
  onSaveRoles: (roles: Role[]) => void
  onSaveSettings: (settings: Settings) => void
}

type Tab = "models" | "roles" | "general"

export default function SettingsPage(props: SettingsPageProps) {
  const [tab, setTab] = useState<Tab>("models")
  const [showAdd, setShowAdd] = useState(false)
  const t = makeT(props.lang)

  return (
    <TContext.Provider value={t}>
      <div className="flex h-full flex-col bg-white">
        <div className="border-b border-black/5 px-4 pb-2 pt-[max(env(safe-area-inset-top),14px)]">
          <div className="mb-3 text-[22px] font-bold text-gray-900">{t("settings.title")}</div>
          <div className="flex gap-1.5">
            {(
              [
                ["models", t("settings.models")],
                ["roles", t("settings.roles")],
                ["general", t("settings.general")],
              ] as [Tab, string][]
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
                  tab === key ? "bg-black text-white" : "bg-black/5 text-gray-600 active:bg-black/10"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-24">
          {tab === "models" && <ModelsTab {...props} showAdd={showAdd} onShowAdd={() => setShowAdd(true)} />}
          {tab === "roles" && <RolesTab {...props} />}
          {tab === "general" && <GeneralTab {...props} />}
        </div>
      </div>
    </TContext.Provider>
  )
}

/* ============ 模型管理 ============ */

function ModelsTab(props: SettingsPageProps & { showAdd: boolean; onShowAdd: () => void }) {
  const t = useT()
  return (
    <div>
      {props.models.length === 0 && (
        <div className="rounded-xl border border-dashed border-black/15 px-4 py-8 text-center">
          <div className="text-[14px] font-medium text-gray-700">{t("settings.noModels.title")}</div>
          <div className="mt-1 text-[12px] leading-5 text-gray-400">{t("settings.noModels.desc")}</div>
        </div>
      )}
      <div className="mt-3 flex flex-col gap-2">
        {props.models.map((m) => (
          <ModelRow key={m.id} model={m} {...props} />
        ))}
      </div>
      {props.showAdd ? (
        <AddModelForm
          onDone={(model) => {
            props.onSaveModels([...props.models, model])
            props.onShowAdd()
            props.onSaveSettings({ ...props.settings, defaultModelId: model.id })
          }}
          onCancel={() => props.onShowAdd()}
        />
      ) : (
        <button
          onClick={props.onShowAdd}
          className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border border-black/10 bg-white py-3 text-[14px] font-medium text-gray-800 transition-colors active:bg-black/5"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          {t("settings.addModel")}
        </button>
      )}
    </div>
  )
}

function ModelRow(props: { model: ModelConfig } & SettingsPageProps) {
  const t = useT()
  const { model } = props
  const isDefault = props.settings.defaultModelId === model.id
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const runTest = async () => {
    setTesting(true)
    setResult(null)
    const r = await testConnection(model.baseURL, model.apiKey, model.modelId)
    setResult(r.message)
    setTesting(false)
  }

  return (
    <div className={`rounded-xl border p-3.5 ${isDefault ? "border-black/30 bg-black/[0.03]" : "border-black/8 bg-white"}`}>
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-gradient-to-br from-[#0ea5e9] to-[#6366f1] text-[15px] font-bold text-white">
          {model.name.slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-[14px] font-semibold text-gray-900">{model.name}</span>
            {isDefault && (
              <span className="shrink-0 rounded-full bg-black px-2 py-0.5 text-[10px] font-medium text-white">{t("settings.model.default")}</span>
            )}
          </div>
          <div className="mt-0.5 truncate text-[12px] text-gray-400">{model.modelId}</div>
          <div className="mt-0.5 truncate text-[11px] text-gray-400">{model.baseURL.replace(/^https?:\/\//, "")}</div>
        </div>
      </div>

      {result && (
        <div className={`mt-2.5 rounded-lg px-3 py-2 text-[12px] ${result.startsWith("✓") ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
          {result}
        </div>
      )}

      <div className="mt-3 flex items-center gap-1.5">
        {!isDefault && (
          <button
            onClick={() => props.onSaveSettings({ ...props.settings, defaultModelId: model.id })}
            className="rounded-full bg-black/5 px-3 py-1.5 text-[12px] font-medium text-gray-700 active:bg-black/10"
          >
            {t("settings.model.setDefault")}
          </button>
        )}
        <button
          onClick={() => void runTest()}
          disabled={testing}
          className="rounded-full bg-black/5 px-3 py-1.5 text-[12px] font-medium text-gray-700 active:bg-black/10 disabled:opacity-50"
        >
          {testing ? t("settings.model.testing") : t("settings.model.test")}
        </button>
        <div className="flex-1" />
        {confirmDelete ? (
          <>
            <button
              onClick={() => {
                props.onSaveModels(props.models.filter((x) => x.id !== model.id))
                if (isDefault) {
                  props.onSaveSettings({ ...props.settings, defaultModelId: props.models[0]?.id })
                }
                setConfirmDelete(false)
              }}
              className="rounded-full bg-red-500 px-3 py-1.5 text-[12px] font-medium text-white active:opacity-80"
            >
              {t("common.confirmDelete")}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="rounded-full bg-black/5 px-3 py-1.5 text-[12px] font-medium text-gray-600 active:bg-black/10"
            >
              {t("common.cancel")}
            </button>
          </>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="rounded-full px-3 py-1.5 text-[12px] font-medium text-red-500 active:bg-red-50"
          >
            {t("settings.model.delete")}
          </button>
        )}
      </div>
    </div>
  )
}

function AddModelForm(props: { onDone: (m: ModelConfig) => void; onCancel: () => void }) {
  const t = useT()
  const [form, setForm] = useState({ name: "", baseURL: "", apiKey: "", modelId: "", systemPrompt: "" })
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const canSave = form.name.trim() && form.baseURL.trim() && form.apiKey.trim() && form.modelId.trim()
  const canTest = form.baseURL.trim() && form.apiKey.trim() && form.modelId.trim()

  const runTest = async () => {
    setTesting(true)
    setResult(null)
    const r = await testConnection(form.baseURL.trim().replace(/\/+$/, ""), form.apiKey.trim(), form.modelId.trim())
    setResult(r.message)
    setTesting(false)
  }

  const submit = () => {
    props.onDone({
      id: uid("model"),
      name: form.name.trim(),
      baseURL: form.baseURL.trim().replace(/\/+$/, ""),
      apiKey: form.apiKey.trim(),
      modelId: form.modelId.trim(),
      systemPrompt: form.systemPrompt.trim() || undefined,
      createdAt: now(),
    })
  }

  return (
    <div className="mt-4 rounded-xl border border-black/10 bg-white p-4">
      <div className="mb-3 text-[14px] font-semibold text-gray-900">{t("settings.addModel")}</div>
      <Field label={t("settings.model.name")}>
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="GPT-4o mini" className={inputCls} />
      </Field>
      <Field label={t("settings.model.baseURL")}>
        <input value={form.baseURL} onChange={(e) => setForm({ ...form, baseURL: e.target.value })} placeholder="https://api.example.com/v1" className={inputCls} />
      </Field>
      <Field label={t("settings.model.apiKey")}>
        <input value={form.apiKey} type="password" onChange={(e) => setForm({ ...form, apiKey: e.target.value })} placeholder="sk-..." className={inputCls} />
      </Field>
      <Field label={t("settings.model.modelId")}>
        <input value={form.modelId} onChange={(e) => setForm({ ...form, modelId: e.target.value })} placeholder="gpt-4o-mini / deepseek-chat" className={inputCls} />
      </Field>
      <Field label={t("settings.model.systemPrompt")}>
        <textarea
          value={form.systemPrompt}
          onChange={(e) => setForm({ ...form, systemPrompt: e.target.value })}
          placeholder={t("settings.model.systemPrompt.ph")}
          rows={3}
          className={inputCls}
        />
      </Field>

      {result && (
        <div className={`mb-2 rounded-lg px-3 py-2 text-[12px] ${result.startsWith("✓") ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
          {result}
        </div>
      )}

      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={() => void runTest()}
          disabled={!canTest || testing}
          className="rounded-full bg-black/5 px-4 py-2 text-[13px] font-medium text-gray-700 active:bg-black/10 disabled:opacity-40"
        >
          {testing ? t("settings.model.testing") : t("settings.model.test")}
        </button>
        <div className="flex-1" />
        <button onClick={props.onCancel} className="rounded-full px-4 py-2 text-[13px] font-medium text-gray-600 active:bg-black/5">
          {t("common.cancel")}
        </button>
        <button
          onClick={submit}
          disabled={!canSave}
          className="rounded-full bg-black px-4 py-2 text-[13px] font-medium text-white active:opacity-80 disabled:opacity-30"
        >
          {t("common.save")}
        </button>
      </div>
    </div>
  )
}

/* ============ 角色与提示词 ============ */

function RolesTab(props: SettingsPageProps) {
  const t = useT()
  const [editing, setEditing] = useState<Role | null>(null)
  const [creating, setCreating] = useState(false)
  const [prompt, setPrompt] = useState("")
  const [name, setName] = useState("")

  const activeRole = props.roles.find((r) => r.id === props.settings.activeRoleId)

  return (
    <div>
      <div className="rounded-xl border border-black/8 bg-white p-4">
        <div className="text-[14px] font-semibold text-gray-900">{t("settings.globalPrompt")}</div>
        <textarea
          value={props.settings.globalPrompt ?? ""}
          onChange={(e) => props.onSaveSettings({ ...props.settings, globalPrompt: e.target.value })}
          placeholder={t("settings.globalPrompt.ph")}
          rows={3}
          className={`${inputCls} mt-2`}
        />
      </div>

      <div className="mb-2 mt-5 flex items-center justify-between">
        <div className="text-[14px] font-semibold text-gray-900">{t("settings.roles.title")}</div>
        <button
          onClick={() => {
            setName("")
            setPrompt("")
            setCreating(true)
          }}
          className="flex items-center gap-1 rounded-full bg-black px-3 py-1.5 text-[12px] font-medium text-white active:opacity-80"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          {t("settings.roles.new")}
        </button>
      </div>

      {activeRole && (
        <div className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-[12px] text-emerald-700">
          {t("settings.roles.active", { name: activeRole.name })}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        {props.roles.map((r) => (
          <div
            key={r.id}
            className={`flex items-center gap-3 rounded-xl border px-3.5 py-3 ${
              props.settings.activeRoleId === r.id ? "border-black/30 bg-black/[0.03]" : "border-black/8 bg-white"
            }`}
          >
            <button
              onClick={() =>
                props.onSaveSettings({
                  ...props.settings,
                  activeRoleId: props.settings.activeRoleId === r.id ? undefined : r.id,
                })
              }
              className="flex size-6 shrink-0 items-center justify-center rounded-full border border-black/15"
              aria-label="启用角色"
            >
              {props.settings.activeRoleId === r.id && <span className="size-3.5 rounded-full bg-black" />}
            </button>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[14px] font-medium text-gray-900">{r.name}</div>
              <div className="mt-0.5 line-clamp-2 text-[11px] leading-4 text-gray-400">{r.prompt}</div>
            </div>
            <button
              onClick={() => {
                setEditing(r)
                setName(r.name)
                setPrompt(r.prompt)
              }}
              className="flex size-8 shrink-0 items-center justify-center rounded-full text-gray-500 active:bg-black/5"
              aria-label="编辑"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M17 3a2.8 2.8 0 113.99 4L9 19l-4 1 1-4L17 3z" />
              </svg>
            </button>
            {!r.builtin && (
              <button
                onClick={() => props.onSaveRoles(props.roles.filter((x) => x.id !== r.id))}
                className="flex size-8 shrink-0 items-center justify-center rounded-full text-gray-500 active:bg-red-50 active:text-red-500"
                aria-label="删除"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" />
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>

      {(creating || editing) && (
        <div className="mt-4 rounded-xl border border-black/10 bg-white p-4">
          <div className="mb-3 text-[14px] font-semibold text-gray-900">
            {editing ? t("settings.roles.edit") : t("settings.roles.create")}
          </div>
          <Field label={t("settings.roles.name")}>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Product Manager" className={inputCls} />
          </Field>
          <Field label={t("settings.roles.prompt")}>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={t("settings.roles.prompt.ph")}
              rows={4}
              className={inputCls}
            />
          </Field>
          <div className="mt-3 flex justify-end gap-2">
            <button
              onClick={() => {
                setEditing(null)
                setCreating(false)
              }}
              className="rounded-full px-4 py-2 text-[13px] font-medium text-gray-600 active:bg-black/5"
            >
              {t("common.cancel")}
            </button>
            <button
              onClick={() => {
                if (!name.trim() || !prompt.trim()) return
                if (editing) {
                  const next = props.roles.map((r) => (r.id === editing.id ? { ...r, name: name.trim(), prompt: prompt.trim() } : r))
                  props.onSaveRoles(next)
                } else {
                  props.onSaveRoles([...props.roles, { id: uid("role"), name: name.trim(), prompt: prompt.trim() }])
                }
                setEditing(null)
                setCreating(false)
              }}
              className="rounded-full bg-black px-4 py-2 text-[13px] font-medium text-white active:opacity-80"
            >
              {t("common.save")}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ============ 通用 ============ */

function GeneralTab(props: SettingsPageProps) {
  const t = useT()
  return (
    <div className="flex flex-col gap-2">
      <div className="rounded-xl border border-black/8 bg-white p-4">
        <div className="text-[14px] font-semibold text-gray-900">{t("settings.general.lang")}</div>
        <div className="mt-2 flex gap-1.5">
          {(
            [
              ["zh", "简体中文"],
              ["en", "English"],
            ] as ["zh" | "en", string][]
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => props.onSaveSettings({ ...props.settings, language: key })}
              className={`rounded-full px-3.5 py-1.5 text-[13px] font-medium ${
                props.settings.language === key ? "bg-black text-white" : "bg-black/5 text-gray-600"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-black/8 bg-white p-4">
        <div className="text-[14px] font-semibold text-gray-900">{t("settings.general.about")}</div>
        <div className="mt-2 space-y-1 text-[12px] leading-5 text-gray-500">
          <div>OpenCode Mobile v0.15</div>
          <div>{t("settings.general.about1")}</div>
          <div>{t("settings.general.about2")}</div>
        </div>
      </div>
    </div>
  )
}

/* ============ 通用控件 ============ */

const inputCls =
  "w-full rounded-[10px] border border-black/10 bg-white px-3 py-2.5 text-[13px] outline-none placeholder:text-gray-400 focus:border-black/30"

function Field(props: { label: string; children: React.ReactNode }) {
  return (
    <label className="mb-3 block">
      <div className="mb-1.5 text-[12px] font-medium text-gray-500">{props.label}</div>
      {props.children}
    </label>
  )
}
