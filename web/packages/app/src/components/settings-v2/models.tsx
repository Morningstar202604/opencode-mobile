import { ButtonV2 } from "@opencode-ai/ui/v2/button-v2"
import { TextInputV2 } from "@opencode-ai/ui/v2/text-input-v2"
import { Icon as IconV2 } from "@opencode-ai/ui/v2/icon"
import { Switch } from "@opencode-ai/ui/v2/switch-v2"
import { showToast } from "@/utils/toast"
import { useLanguage } from "@/context/language"
import { useModels } from "@/context/models"
import { useServerSDK } from "@/context/server-sdk"
import { useServerSync } from "@/context/server-sync"
import { createMemo, createSignal, type Component, For, Show } from "solid-js"
import { createStore } from "solid-js/store"
import { SettingsListV2 } from "./parts/list"
import "./settings-v2.css"

type ModelItem = ReturnType<ReturnType<typeof useModels>["list"]>[number]

/**
 * OpenCode Mobile — 完全自定义模型管理（v0.12）
 * 不参考 OpenCode 原生 provider/模型分组界面：
 * 「我的模型」拍平列表 + 添加模型表单（名称/API 地址/API Key/模型 ID）
 * 背后调用：PUT /auth/:providerID（存 Key）+ PATCH /config（写 provider 配置）
 */
export const SettingsModelsV2: Component = () => {
  const language = useLanguage()
  const models = useModels()
  const serverSdk = useServerSDK()
  const serverSync = useServerSync()
  const [adding, setAdding] = createSignal(false)
  const [saving, setSaving] = createSignal(false)
  const [form, setForm] = createStore({ name: "", baseURL: "", apiKey: "", modelId: "" })
  const [testState, setTestState] = createSignal<"idle" | "testing" | "ok" | "fail">("idle")
  const [testMsg, setTestMsg] = createSignal("")

  const allModels = createMemo(() => {
    try {
      return models.list()
    } catch (e) {
      console.error("[OCM-ALLMODELS]", e)
      return []
    }
  })
  const canSave = () => !!(form.name.trim() && form.baseURL.trim() && form.apiKey.trim() && form.modelId.trim())

  // 测试连接：前端直连 API（OpenAI 兼容 /chat/completions），验证地址+Key+模型可用
  const testConnection = async () => {
    const baseURL = form.baseURL.trim().replace(/\/+$/, "")
    const apiKey = form.apiKey.trim()
    const modelId = form.modelId.trim()
    if (!baseURL || !apiKey || !modelId) {
      setTestState("fail")
      setTestMsg("请先填写 API 地址、API Key 与模型 ID")
      return
    }
    setTestState("testing")
    setTestMsg("正在测试连接…")
    try {
      const res = await fetch(`${baseURL}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model: modelId, messages: [{ role: "user", content: "ping" }], max_tokens: 8 }),
      })
      if (!res.ok) {
        const body = await res.text().catch(() => "")
        setTestState("fail")
        setTestMsg(`连接失败（${res.status}）${body.slice(0, 100) ? "：" + body.slice(0, 100) : ""}`)
        return
      }
      const data = await res.json().catch(() => null)
      const reply: string = data?.choices?.[0]?.message?.content?.trim?.() ?? ""
      setTestState("ok")
      setTestMsg(reply ? `✓ 连接成功，模型响应：${reply.slice(0, 40)}` : "✓ 连接成功，模型已响应（推理模型回复可能为空）")
    } catch (err) {
      setTestState("fail")
      setTestMsg(`连接失败：${err instanceof Error ? err.message : String(err)}`)
    }
  }

  const save = async () => {
    const name = form.name.trim()
    const baseURL = form.baseURL.trim().replace(/\/+$/, "")
    const apiKey = form.apiKey.trim()
    const modelId = form.modelId.trim()
    setSaving(true)
    const providerID = `custom-${Date.now().toString(36)}`
    try {
      await serverSdk().client.auth.set({ providerID, auth: { type: "api", key: apiKey } })
      await serverSync().updateConfig({
        provider: {
          [providerID]: {
            npm: "@ai-sdk/openai-compatible",
            name,
            options: { baseURL },
            models: { [modelId]: { name } },
          },
        },
      })
      showToast({
        variant: "success",
        icon: "circle-check",
        title: "模型已添加",
        description: `${name}（${modelId}）`,
      })
      setForm({ name: "", baseURL: "", apiKey: "", modelId: "" })
      setAdding(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      showToast({ title: language.t("common.requestFailed"), description: message })
    } finally {
      setSaving(false)
    }
  }

  const remove = async (item: ModelItem) => {
    try {
      await serverSdk()
        .client.auth.remove({ providerID: item.provider.id })
        .catch(() => undefined)
      const before = serverSync().data.config.disabled_providers ?? []
      const next = before.includes(item.provider.id) ? before : [...before, item.provider.id]
      await serverSync().updateConfig({ disabled_providers: next })
      showToast({ variant: "success", icon: "circle-check", title: "模型已移除", description: item.name })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      showToast({ title: language.t("common.requestFailed"), description: message })
    }
  }

  return (
    <>
      <div class="settings-v2-tab-header settings-v2-tab-header--stacked">
        <h2 class="settings-v2-tab-title">模型</h2>
        <button
          type="button"
          class="settings-models-add"
          data-component="settings-models-add"
          onClick={() => setAdding((a) => !a)}
        >
          <IconV2 name={adding() ? "close" : "plus"} size="small" />
          <span>{adding() ? "取消" : "添加"}</span>
        </button>
      </div>

      <div class="settings-v2-tab-body settings-v2-models">
        <Show
          when={allModels().length > 0}
          fallback={
            <div class="settings-v2-models-status">
              <span>还没有模型</span>
              <span class="text-v2-text-text-faint">点右上角「添加」，配置你的 API 地址与 Key</span>
            </div>
          }
        >
          <SettingsListV2>
            <For each={allModels()}>
              {(item) => {
                const key = { providerID: item.provider.id, modelID: item.id }
                return (
                  <div class="settings-model-row" data-component="settings-model-row">
                    <span class="settings-model-avatar">
                      {String(item.name ?? "?").slice(0, 1).toUpperCase()}
                    </span>
                    <div class="flex min-w-0 flex-1 flex-col items-start">
                      <span class="max-w-full truncate text-14-medium text-v2-text-text-base">{String(item.name ?? "")}</span>
                      <span class="max-w-full truncate text-12-regular text-v2-text-text-faint">
                        {String(item.id ?? "")} · {String(item.provider?.name ?? "")}
                      </span>
                    </div>
                    <Switch
                      checked={models.visible(key)}
                      onChange={(checked) => {
                        models.setVisibility(key, checked)
                      }}
                      hideLabel
                    >
                      {item.name}
                    </Switch>
                    <button
                      type="button"
                      class="settings-model-remove"
                      data-component="settings-model-remove"
                      aria-label="移除模型"
                      onClick={() => void remove(item)}
                    >
                      <IconV2 name="trash" size="small" />
                    </button>
                  </div>
                )
              }}
            </For>
          </SettingsListV2>
        </Show>

        <Show when={adding()}>
          <div class="settings-model-sheet" data-component="settings-model-sheet">
            <div class="settings-model-sheet-title">添加模型</div>
            <div class="settings-model-sheet-sub">填入你的 API 服务信息，完全自定义</div>
            <TextInputV2
              label="显示名称"
              placeholder="如：GPT-4o mini"
              value={form.name}
              onChange={(e) => setForm("name", e.currentTarget.value)}
            />
            <TextInputV2
              label="API 地址"
              placeholder="https://api.openai.com/v1"
              value={form.baseURL}
              onChange={(e) => setForm("baseURL", e.currentTarget.value)}
            />
            <TextInputV2
              label="API Key"
              type="password"
              placeholder="sk-..."
              value={form.apiKey}
              onChange={(e) => setForm("apiKey", e.currentTarget.value)}
            />
            <TextInputV2
              label="模型 ID"
              placeholder="gpt-4o-mini"
              value={form.modelId}
              onChange={(e) => setForm("modelId", e.currentTarget.value)}
            />
            <div class="settings-model-test-row">
              <ButtonV2
                type="button"
                appearance="secondary"
                disabled={testState() === "testing"}
                onClick={() => void testConnection()}
              >
                {testState() === "testing" ? "测试中…" : "测试连接"}
              </ButtonV2>
              <Show when={testState() !== "idle"}>
                <span
                  class="settings-model-test-msg"
                  data-state={testState()}
                  data-component="settings-model-test-msg"
                >
                  {testMsg()}
                </span>
              </Show>
            </div>
            <ButtonV2
              type="button"
              appearance="primary"
              class="w-full"
              disabled={!canSave() || saving()}
              onClick={() => void save()}
            >
              {saving() ? "保存中…" : "保存模型"}
            </ButtonV2>
          </div>
        </Show>
      </div>
    </>
  )
}
