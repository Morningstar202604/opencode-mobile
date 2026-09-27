import { createEffect, For, Show, Suspense, type ParentProps } from "solid-js"
import { createStore } from "solid-js/store"
import { useNavigate } from "@solidjs/router"
import { Icon } from "@opencode-ai/ui/icon"
import { IconButton } from "@opencode-ai/ui/icon-button"
import { useDialog } from "@opencode-ai/ui/context/dialog"
import { DebugBar } from "@/components/debug-bar"
import { TabsInfoPopup } from "@/components/help-button"
import { Titlebar, type TitlebarUpdate } from "@/components/titlebar"
import { useGlobal } from "@/context/global"
import { useLanguage } from "@/context/language"
import { useLayout } from "@/context/layout"
import { usePlatform } from "@/context/platform"
import { ServerConnection, serverName, useServer } from "@/context/server"
import { useTabs } from "@/context/tabs"
import { setV2Toast, ToastRegion } from "@/utils/toast"

export default function NewLayout(props: ParentProps) {
  const platform = usePlatform()
  const [state, setState] = createStore({ debugTools: true })

  createEffect(() => setV2Toast(true))

  const update: TitlebarUpdate = {
    version: () => {
      const state = platform.updater?.state()
      if (state?.status !== "ready") return
      return state.version
    },
    installing: () => platform.updater?.state().status === "installing",
    install: () => void platform.updater?.install(),
  }

  return (
    <div
      class="relative bg-v2-background-bg-deep flex-1 min-h-0 min-w-0 flex flex-col select-none [&_input]:select-text [&_textarea]:select-text [&_[contenteditable]]:select-text"
      style={{
        "padding-top": "env(safe-area-inset-top, 0px)",
        "padding-bottom": "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <Titlebar
        update={update}
        debugTools={
          import.meta.env.DEV
            ? { visible: state.debugTools, toggle: () => setState("debugTools", (value) => !value) }
            : undefined
        }
      />
      <main class="flex-1 min-h-0 min-w-0 overflow-x-hidden flex flex-col items-start contain-strict max-xl:pb-[calc(56px+env(safe-area-inset-bottom,0px))]">
        <Suspense>{props.children}</Suspense>
      </main>
      {import.meta.env.DEV && state.debugTools && <DebugBar inline />}
      <MobileSidebarDrawer />
      <MobileTabBar />
      <TabsInfoPopup />
      <ToastRegion v2 />
    </div>
  )
}

/**
 * OpenCode Mobile — 底部主导航（豆包/ChatGPT 形态，手机端）
 * 对话 / ＋新建 / 我的 三个 tab，全局常驻；桌面端（>=1280px）不渲染。
 */
function MobileTabBar() {
  const layout = useLayout()
  const navigate = useNavigate()
  const dialog = useDialog()
  const tabs = useTabs()
  const global = useGlobal()
  const server = useServer()
  const language = useLanguage()

  const routeType = () => layout.route().type

  const goHome = () => {
    tabs.toggleHome({ home: routeType() === "home", current: undefined })
  }

  const goNewSession = () => {
    const conn = global.servers.list().find(() => true) ?? server.current
    if (!conn) return
    const ctx = global.ensureServerCtx(conn)
    const projects = ctx?.projects.list() ?? []
    const directory = projects[0]?.worktree ?? ctx?.sync.data.path.home
    if (!directory) return
    void tabs.newDraft({ server: ServerConnection.key(conn), directory })
  }

  const goMine = () => {
    void import("@/components/settings-v2").then((module) =>
      dialog.show(() => <module.DialogSettings sessionID={undefined} />),
    )
  }

  return (
    <nav
      aria-label="Mobile tab bar"
      data-component="mobile-tab-bar"
      class="xl:hidden fixed inset-x-0 bottom-0 z-40 flex h-[56px] items-stretch border-t border-v2-border-border-muted bg-v2-background-bg-base shadow-[0_-1px_12px_rgba(15,23,42,0.06)]"
      style={{ "padding-bottom": "env(safe-area-inset-bottom, 0px)" }}
    >
      <button
        type="button"
        data-slot="tab-home"
        class="flex flex-1 flex-col items-center justify-center gap-0.5 text-11-medium"
        classList={{
          "text-v2-icon-icon-accent": routeType() === "home" || routeType() === "session" || routeType() === "draft",
          "text-v2-text-text-muted": !(routeType() === "home" || routeType() === "session" || routeType() === "draft"),
        }}
        onClick={goHome}
      >
        <Icon name="speech-bubble" size="normal" />
        <span>对话</span>
      </button>

      <div class="flex flex-1 items-center justify-center">
        <button
          type="button"
          data-slot="tab-new"
          aria-label="新建会话"
          class="flex size-12 items-center justify-center rounded-full bg-[var(--v2-icon-icon-accent)] text-white shadow-[var(--v2-elevation-raised)] active:scale-95 transition-transform"
          onClick={goNewSession}
        >
          <Icon name="new-session" size="normal" />
        </button>
      </div>

      <button
        type="button"
        data-slot="tab-mine"
        class="flex flex-1 flex-col items-center justify-center gap-0.5 text-11-medium text-v2-text-text-muted"
        onClick={goMine}
      >
        <Icon name="settings-gear" size="normal" />
        <span>我的</span>
      </button>
    </nav>
  )
}

/**
 * OpenCode Mobile — 移动端侧栏抽屉（v2 布局专用）
 * 桌面端（>=768px）不渲染；窄屏下由顶栏汉堡按钮触发。
 * 内容：主页 / 新建会话 / 当前会话 tab 列表（点击切换）。
 */
function MobileSidebarDrawer() {
  const layout = useLayout()
  const tabs = useTabs()
  const navigate = useNavigate()
  const language = useLanguage()
  const global = useGlobal()

  const opened = () => layout.mobileSidebar.opened()
  const hide = () => layout.mobileSidebar.hide()
  const dialog = useDialog()

  const goModelSettings = () => {
    hide()
    void import("@/components/settings-v2").then((module) =>
      dialog.show(() => <module.DialogSettings sessionID={undefined} defaultValue="providers" />),
    )
  }

  const go = (href: string) => {
    hide()
    navigate(href)
  }

  const goHome = () => {
    hide()
    tabs.toggleHome({ home: layout.route().type === "home", current: undefined })
  }

  const goNewSession = () => {
    hide()
    navigate("/new-session")
  }

  const selectTab = (tab: { server: string; sessionId: string }) => {
    hide()
    tabs.select(tab)
  }

  const sessionTabs = () =>
    tabs.store.filter((item) => item.type === "session").slice(0, 50)

  const titleFor = (tab: { server: string; sessionId: string }) => {
    const conn = global.servers
      .list()
      .find((item) => ServerConnection.key(item) === tab.server)
    return serverName(conn) || tab.sessionId.slice(0, 18)
  }

  return (
    <div class="xl:hidden">
      <Show when={opened()}>
        <div
          class="fixed inset-0 z-40 bg-black/40 transition-opacity duration-200"
          onClick={hide}
        />
      </Show>
      <nav
        aria-label="Mobile navigation"
        data-component="mobile-drawer-v2"
        classList={{
          "fixed inset-y-0 start-0 z-50 w-[85vw] max-w-[360px] overflow-hidden border-e border-border-weaker-base bg-v2-background-bg-base transition-transform duration-200 ease-out flex flex-col":
            true,
          "translate-x-0": opened(),
          "ltr:-translate-x-full rtl:translate-x-full": !opened(),
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <header class="flex shrink-0 items-center justify-between gap-2 border-b border-border-weaker-base px-3 py-3">
          <span class="truncate text-14-medium">OpenCode</span>
          <IconButton icon="x" variant="ghost" onClick={hide} aria-label="Close menu" />
        </header>

        <div class="flex-1 overflow-y-auto p-2">
          <button
            type="button"
            class="mb-1 flex w-full items-center gap-2 rounded-lg px-3 py-3 text-start text-14-medium hover:bg-v2-background-bg-deep"
            onClick={goHome}
          >
            <span data-slot="home">{language.t("home.title")}</span>
          </button>
          <button
            type="button"
            class="mb-2 flex w-full items-center gap-2 rounded-lg px-3 py-3 text-start text-14-medium hover:bg-v2-background-bg-deep"
            onClick={goNewSession}
          >
            <span data-slot="new">{language.t("command.session.new")}</span>
          </button>
          <button
            type="button"
            class="mb-2 flex w-full items-center gap-2 rounded-lg px-3 py-3 text-start text-14-medium hover:bg-v2-background-bg-deep"
            onClick={goModelSettings}
          >
            <span data-slot="models">模型设置</span>
          </button>

          <Show when={sessionTabs().length > 0}>
            <div class="mb-1 px-3 py-1 text-12-regular text-text-weak">会话</div>
            <div class="flex flex-col gap-1">
              <For each={sessionTabs()}>
                {(tab) => (
                  <button
                    type="button"
                    class="flex w-full items-center gap-2 rounded-lg px-3 py-3 text-start text-14-regular hover:bg-v2-background-bg-deep"
                    onClick={() => selectTab(tab)}
                  >
                    <span class="truncate">{titleFor(tab)}</span>
                  </button>
                )}
              </For>
            </div>
          </Show>
        </div>
      </nav>
    </div>
  )
}
