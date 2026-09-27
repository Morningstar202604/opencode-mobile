import { Component, createMemo, createSignal, startTransition } from "solid-js"
import { Dialog } from "@opencode-ai/ui/v2/dialog-v2"
import { TabsV2 } from "@opencode-ai/ui/v2/tabs-v2"
import { Icon } from "@opencode-ai/ui/icon"
import { useLanguage } from "@/context/language"
import { usePlatform } from "@/context/platform"
import { SettingsGeneralV2 } from "./general"
import { SettingsKeybinds } from "../settings-keybinds"
import { SettingsProvidersV2 } from "./providers"
import { SettingsModelsV2 } from "./models"
import "./settings-v2.css"
import { SettingsServersV2 } from "./servers"
import { useDialog } from "@opencode-ai/ui/context/dialog"
import { useLayout } from "@/context/layout"
import { useTabs } from "@/context/tabs"
import { useServerSync } from "@/context/server-sync"

export const DialogSettings: Component<{
  sessionID?: string
  defaultValue?: string
}> = (props) => {
  const language = useLanguage()
  const platform = usePlatform()
  const dialog = useDialog()
  const layout = useLayout()
  const tabs = useTabs()
  const serverSync = useServerSync()
  const [tab, setTab] = createSignal(props.defaultValue ?? "index")
  const directory = createMemo(() => {
    const route = layout.route()
    if (route.type === "dir-new-sesssion") return route.dir
    if (route.type === "draft") {
      const draft = tabs.store.find((item) => item.type === "draft" && item.draftID === route.draftID)
      return draft?.type === "draft" ? draft.directory : undefined
    }
    if (route.type === "session") return serverSync().session.get(route.sessionId)?.directory
    return undefined
  })

  const showProviders = () => {
    void dialog.show(() => <DialogSettings sessionID={props.sessionID} defaultValue="providers" />)
  }

  return (
    <Dialog size="x-large" variant="settings" class="settings-v2-dialog">
      {/* OpenCode Mobile：手机端关闭按钮（全屏设置页的返回入口，v0.10） */}
      <button
        type="button"
        data-component="settings-close"
        aria-label="关闭设置"
        class="hidden max-lg:flex absolute right-4 top-3 z-50 size-9 items-center justify-center rounded-full bg-v2-background-bg-layer-02 text-v2-text-text-muted transition-colors active:bg-v2-overlay-simple-overlay-hover"
        onClick={() => dialog.close()}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            d="M4 4l8 8M12 4l-8 8"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
          />
        </svg>
      </button>
      {/* 子页返回设置主页（豆包式二级导航，v0.11） */}
      <Show when={tab() !== "index"}>
        <button
          type="button"
          data-component="settings-back-home"
          aria-label="返回设置"
          class="hidden max-lg:flex absolute left-4 top-3 z-50 size-9 items-center justify-center rounded-full bg-v2-background-bg-layer-02 text-v2-text-text-muted transition-colors active:bg-v2-overlay-simple-overlay-hover"
          onClick={() => void startTransition(() => setTab("index"))}
        >
          <Icon name="chevron-left" size="small" />
        </button>
      </Show>
      <TabsV2
        orientation="vertical"
        variant="settings"
        value={tab()}
        onChange={(value) => void startTransition(() => setTab(value))}
        class="settings-v2"
      >
        <TabsV2.List>
          <div class="flex flex-col justify-between h-full w-full">
            <div class="flex flex-col gap-3 w-full">
              <div class="flex flex-col gap-3">
                <div class="flex flex-col gap-1.5">
                  <TabsV2.Trigger value="index">
                    <Icon name="sliders" />
                    {language.t("settings.tab.general")}
                  </TabsV2.Trigger>
                  <TabsV2.SectionTitle>{language.t("settings.section.desktop")}</TabsV2.SectionTitle>
                  <div class="flex flex-col gap-1.5 w-full">
                    <TabsV2.Trigger value="general">
                      <Icon name="sliders" />
                      {language.t("settings.tab.general")}
                    </TabsV2.Trigger>
                    <TabsV2.Trigger value="shortcuts">
                      <Icon name="keyboard" />
                      {language.t("settings.tab.shortcuts")}
                    </TabsV2.Trigger>
                  </div>
                </div>

                <div class="flex flex-col gap-1.5">
                  <TabsV2.SectionTitle>{language.t("settings.section.server")}</TabsV2.SectionTitle>
                  <div class="flex flex-col gap-1.5 w-full">
                    <TabsV2.Trigger value="servers">
                      <Icon name="server" />
                      {language.t("status.popover.tab.servers")}
                    </TabsV2.Trigger>
                    <TabsV2.Trigger value="providers">
                      <Icon name="providers" />
                      {language.t("settings.providers.title")}
                    </TabsV2.Trigger>
                    <TabsV2.Trigger value="models">
                      <Icon name="models" />
                      {language.t("settings.models.title")}
                    </TabsV2.Trigger>
                  </div>
                </div>
              </div>
            </div>
            <div class="settings-v2-nav-footer">
              <span>{language.t("app.name.desktop")}</span>
              <span>v{platform.version}</span>
            </div>
          </div>
        </TabsV2.List>
        <TabsV2.Content value="index" class="settings-v2-panel settings-home-panel">
          {/* OpenCode Mobile — 设置主页（豆包式列表，功能入口） */}
          <div class="flex flex-col gap-2 p-4">
            <div class="px-1 pb-2">
              <h2 class="text-20-medium text-v2-text-text-base">设置</h2>
              <p class="mt-0.5 text-13-regular text-v2-text-text-faint">模型、服务器与通用选项</p>
            </div>

            <button
              type="button"
              data-component="settings-home-row"
              class="settings-home-row"
              onClick={() => void startTransition(() => setTab("models"))}
            >
              <span class="settings-home-icon">
                <Icon name="models" />
              </span>
              <span class="flex min-w-0 flex-1 flex-col items-start">
                <span class="text-15-medium text-v2-text-text-base">模型</span>
                <span class="text-12-regular text-v2-text-text-faint">管理 AI 模型与 API Key</span>
              </span>
              <Icon name="chevron-right" size="small" />
            </button>

            <button
              type="button"
              data-component="settings-home-row"
              class="settings-home-row"
              onClick={() => void startTransition(() => setTab("servers"))}
            >
              <span class="settings-home-icon">
                <Icon name="server" />
              </span>
              <span class="flex min-w-0 flex-1 flex-col items-start">
                <span class="text-15-medium text-v2-text-text-base">服务器</span>
                <span class="text-12-regular text-v2-text-text-faint">连接 OpenCode 后端地址</span>
              </span>
              <Icon name="chevron-right" size="small" />
            </button>

            <button
              type="button"
              data-component="settings-home-row"
              class="settings-home-row"
              onClick={() => void startTransition(() => setTab("providers"))}
            >
              <span class="settings-home-icon">
                <Icon name="providers" />
              </span>
              <span class="flex min-w-0 flex-1 flex-col items-start">
                <span class="text-15-medium text-v2-text-text-base">提供商</span>
                <span class="text-12-regular text-v2-text-text-faint">自定义 API 服务商配置</span>
              </span>
              <Icon name="chevron-right" size="small" />
            </button>

            <button
              type="button"
              data-component="settings-home-row"
              class="settings-home-row"
              onClick={() => void startTransition(() => setTab("general"))}
            >
              <span class="settings-home-icon">
                <Icon name="sliders" />
              </span>
              <span class="flex min-w-0 flex-1 flex-col items-start">
                <span class="text-15-medium text-v2-text-text-base">通用</span>
                <span class="text-12-regular text-v2-text-text-faint">语言与行为选项</span>
              </span>
              <Icon name="chevron-right" size="small" />
            </button>

            <div class="mt-2 px-1 text-12-regular text-v2-text-text-faint">
              OpenCode Mobile · v{platform.version}
            </div>
          </div>
        </TabsV2.Content>
        <TabsV2.Content value="general" class="settings-v2-panel">
          <SettingsGeneralV2 sessionID={props.sessionID} />
        </TabsV2.Content>
        <TabsV2.Content value="shortcuts" class="settings-v2-panel">
          <SettingsKeybinds v2 />
        </TabsV2.Content>
        <TabsV2.Content value="servers" class="settings-v2-panel">
          <SettingsServersV2 />
        </TabsV2.Content>
        <TabsV2.Content value="providers" class="settings-v2-panel">
          <SettingsProvidersV2 directory={directory} onBack={showProviders} />
        </TabsV2.Content>
        <TabsV2.Content value="models" class="settings-v2-panel">
          <SettingsModelsV2 />
        </TabsV2.Content>
      </TabsV2>
    </Dialog>
  )
}
