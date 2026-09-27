import { ScrollView } from "@opencode-ai/ui/scroll-view"
import { createHomeController } from "./home/home-controller"
import { createHomeProjectsController } from "./home/home-projects-controller"
import { HomeUtilityNav } from "./home/home-projects-view"
import { HomeProjects } from "./home/home-projects"
import { createHomeScrollController } from "./home/home-scroll-controller"
import { createHomeSessionSearchController } from "./home/home-session-search-controller"
import { createHomeSessionsController } from "./home/home-sessions-controller"
import { HomeSessions } from "./home/home-sessions"
import { ServerConnection } from "@/context/server"
import { useTabs } from "@/context/tabs"

/**
 * OpenCode Mobile — 首页（豆包/ChatGPT 形态）
 * 手机端（<768px）：对话列表优先 —— 顶部问候 + 会话分组列表；
 * 新建对话走底部导航「＋」；项目列在手机端隐藏（可从抽屉/设置进入），桌面端保留原双栏布局。
 */
export function NewHome() {
  const home = createHomeController()
  const projects = createHomeProjectsController(home)
  const sessions = createHomeSessionsController(home)
  const search = createHomeSessionSearchController(home, sessions)
  const scroll = createHomeScrollController(sessions.data.groups)
  const tabs = useTabs()

  const quickSubmit = (event: SubmitEvent) => {
    event.preventDefault()
    const form = event.currentTarget as HTMLFormElement
    const input = form.querySelector("input") as HTMLInputElement | null
    const prompt = input?.value.trim()
    if (!prompt) return
    const conn = home.server.focused()
    const project = home.project.newSession()
    const directory = project?.worktree ?? home.project.homedir()
    if (!conn || !directory) return
    void tabs.newDraft({ server: ServerConnection.key(conn), directory }, prompt)
  }
  return (
    <div
      class={`
        relative min-h-0 flex-1 self-stretch overflow-hidden
        bg-v2-background-bg-base
        m-0 md:m-2 md:rounded-[10px] md:shadow-[var(--v2-elevation-raised)]
      `}
    >
      <ScrollView
        class="h-full [container-type:size]"
        thumbContainer={scroll.viewport.thumbTrack}
        thumbHoverTarget={scroll.viewport.hoverTarget}
        viewportRef={scroll.viewport.setViewport}
        onScroll={(event) => scroll.viewport.update(event.currentTarget.scrollTop)}
        onWheel={scroll.viewport.containOuterWheel}
      >
        <div
          class={`
            mx-auto grid min-h-full w-full max-w-[1080px] grid-rows-[auto_minmax(0,1fr)_auto] gap-4 px-3
            lg:grid-cols-[280px_minmax(0,720px)] lg:grid-rows-1 lg:gap-8 lg:px-6
          `}
        >
          <div class="contents lg:contents">
            {/* 手机端问候头部（对话列表页顶部，豆包/千问风格） */}
            <div class="hidden max-lg:block pb-1 pt-6">
              <h1 class="text-22-medium text-v2-text-text-base">对话</h1>
              <p class="mt-1 text-13-regular text-v2-text-text-faint">
                和智能体一起写代码、改文件、跑命令
              </p>
              {/* v0.10 首页输入框：输入即新建会话（豆包式首页直输） */}
              <form
                data-slot="home-quick-prompt"
                onSubmit={quickSubmit}
                class="mt-3"
              >
                <div class="flex h-12 items-center gap-2 rounded-full border border-v2-overlay-simple-overlay-hover bg-v2-background-bg-layer-01 px-4 focus-within:border-v2-icon-icon-accent">
                  <span class="text-v2-icon-icon-faint" aria-hidden="true">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <path
                        d="M9 2.5a6.5 6.5 0 0 0-6.5 6.5c0 1.2.33 2.32.9 3.28l-.77 2.72 2.72-.77a6.48 6.48 0 0 0 3.65 1.1A6.5 6.5 0 1 0 9 2.5Z"
                        stroke="currentColor"
                        stroke-width="1.3"
                      />
                    </svg>
                  </span>
                  <input
                    data-component="home-quick-input"
                    type="text"
                    placeholder="输入消息，直接开始对话…"
                    enterKeyHint="send"
                    class="min-w-0 flex-1 bg-transparent text-[15px] text-v2-text-text-base placeholder:text-v2-text-text-faint focus:outline-none"
                  />
                  <button
                    type="submit"
                    data-component="home-quick-submit"
                    aria-label="发送"
                    class="hidden size-8 shrink-0 items-center justify-center rounded-full bg-v2-icon-icon-accent text-v2-text-text-inverse"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M8 13.5V2.5m0 0L3.5 7M8 2.5l4.5 4.5"
                        stroke="currentColor"
                        stroke-width="1.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              </form>
            </div>
            {/* 项目列：手机端隐藏，桌面端保留 */}
            <div class="hidden lg:contents">
              <HomeProjects projects={projects} scroll={scroll} />
            </div>
            <HomeSessions sessions={sessions} search={search} scroll={scroll} />
            <HomeUtilityNav
              class="flex lg:hidden"
              onOpenSettings={projects.utility.settings}
              onOpenHelp={projects.utility.help}
              language={projects.copy.language}
            />
          </div>
        </div>
      </ScrollView>
    </div>
  )
}
