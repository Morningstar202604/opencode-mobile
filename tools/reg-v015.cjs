// OpenCode Mobile v0.15 回归测试 v2
const { chromium } = require("playwright")

const BASE = "http://127.0.0.1:8190/"
const MOCK = { baseURL: "http://127.0.0.1:9017/v1", apiKey: "mock-key", modelId: "mock-model" }

const failures = []
function check(name, cond, extra = "") {
  if (cond) console.log(`PASS  ${name}`)
  else {
    failures.push(name)
    console.log(`FAIL  ${name} ${extra}`)
  }
}

async function main() {
  const browser = await chromium.launch({
    executablePath: "/usr/local/bin/chromium",
    args: ["--no-sandbox", "--no-proxy-server"],
  })
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
  page.on("pageerror", (e) => console.log("PAGEERROR:", e.message))

  // ---- 0. 干净环境 ----
  await page.goto(BASE, { waitUntil: "networkidle" })
  await page.evaluate(() => localStorage.clear())
  await page.reload({ waitUntil: "networkidle" })
  await page.waitForTimeout(500)

  // ---- 1. 首页 ----
  let body = await page.evaluate(() => document.body.innerText)
  check("首页标题「对话」", body.includes("对话"))
  check("底部导航含 4 项", body.includes("对话") && body.includes("代码") && body.includes("我的"))

  // ---- 2. 配置 mock 模型 ----
  await page.getByText("我的", { exact: true }).click()
  await page.waitForTimeout(300)
  body = await page.evaluate(() => document.body.innerText)
  check("设置页三个 Tab", body.includes("模型管理") && body.includes("角色与提示词") && body.includes("通用"))
  await page.getByText("通用", { exact: true }).click()
  await page.waitForTimeout(300)
  body = await page.evaluate(() => document.body.innerText)
  check("关于 v0.15", body.includes("v0.15"))
  await page.getByText("模型管理", { exact: true }).click()
  await page.waitForTimeout(300)
  await page.getByText("添加模型", { exact: true }).click()
  await page.waitForTimeout(300)
  await page.getByPlaceholder("GPT-4o mini").fill("Mock 模型")
  await page.getByPlaceholder("https://api.example.com/v1").fill(MOCK.baseURL)
  await page.getByPlaceholder("sk-...").fill(MOCK.apiKey)
  await page.getByPlaceholder("gpt-4o-mini / deepseek-chat").fill(MOCK.modelId)
  await page.getByText("保存", { exact: true }).last().click()
  await page.waitForTimeout(500)
  body = await page.evaluate(() => document.body.innerText)
  check("模型已保存", body.includes("Mock 模型") && body.includes("mock-model"))

  // ---- 3. 代码 Tab：新建/编辑/保存/插入聊天 ----
  await page.getByText("代码", { exact: true }).click()
  await page.waitForTimeout(300)
  body = await page.evaluate(() => document.body.innerText)
  check("代码页空态", body.includes("还没有文件"))
  await page.getByText("新建文件", { exact: true }).click()
  await page.waitForTimeout(300)
  await page.getByPlaceholder("app.py").fill("hello.py")
  await page.fill("textarea", 'def hello():\n    return "hi from ocm"\n')
  await page.getByText("保存", { exact: true }).click()
  await page.waitForTimeout(500)
  body = await page.evaluate(() => document.body.innerText)
  check("文件已保存到列表", body.includes("hello.py"))
  await page.getByText("插入聊天", { exact: true }).click()
  await page.waitForTimeout(600)
  body = await page.evaluate(() => document.body.innerText)
  check("插入聊天进入会话页（标题新对话）", body.includes("新对话"))
  const inputVal = await page.evaluate(() => document.querySelector("textarea")?.value ?? "")
  check("输入框预填文件内容", inputVal.includes("def hello"), `actual=${JSON.stringify(inputVal.slice(0, 40))}`)

  // ---- 4. 发送消息：思考 + 工具调用 + Markdown ----
  await page.fill("textarea", "给我分析这段代码")
  await page.keyboard.press("Enter")
  await page.waitForTimeout(4000)
  body = await page.evaluate(() => document.body.innerText)
  check("思考过程卡片", body.includes("思考过程"))
  check("工具调用 chips", body.includes("get_current_weather"))
  check("Markdown 标题渲染", body.includes("项目结构分析"))
  check("代码高亮块", body.includes("Hello OpenCode Mobile"))
  check("表格渲染", body.includes("本地会话") && body.includes("模型连接"))
  check("引用块渲染", body.includes("示例回复"))

  await page.screenshot({ path: "tools/v015-chat-markdown.png" })

  // ---- 5. 返回 + i18n 英文 ----
  await page.locator("header button").first().click()
  await page.waitForTimeout(400)
  body = await page.evaluate(() => document.body.innerText)
  check("返回会话列表", body.includes("对话") && body.includes("给我分析这段代码"))
  await page.getByText("我的", { exact: true }).click()
  await page.waitForTimeout(300)
  await page.getByText("通用", { exact: true }).click()
  await page.waitForTimeout(300)
  await page.getByText("English", { exact: true }).click()
  await page.waitForTimeout(400)
  body = await page.evaluate(() => document.body.innerText)
  check("英文设置页", body.includes("Models") && body.includes("Roles") && body.includes("General"))
  await page.getByText("Chat", { exact: true }).click()
  await page.waitForTimeout(400)
  body = await page.evaluate(() => document.body.innerText)
  check("英文会话页标题", body.includes("Chat"))
  // 切回中文
  await page.getByText("Me", { exact: true }).click()
  await page.waitForTimeout(300)
  await page.getByText("General", { exact: true }).click()
  await page.waitForTimeout(300)
  await page.getByText("简体中文", { exact: true }).click()
  await page.waitForTimeout(300)

  // ---- 6. 截图 ----
  await page.getByText("对话", { exact: true }).click()
  await page.waitForTimeout(400)
  await page.screenshot({ path: "tools/v015-sessions.png" })
  await page.getByText("给我分析这段代码", { exact: true }).first().click()
  await page.waitForTimeout(800)
  await page.screenshot({ path: "tools/v015-chat-history.png" })
  await page.locator("header button").first().click()
  await page.waitForTimeout(300)
  await page.getByText("我的", { exact: true }).click()
  await page.waitForTimeout(300)
  await page.screenshot({ path: "tools/v015-settings.png" })
  await page.getByText("代码", { exact: true }).click()
  await page.waitForTimeout(300)
  await page.screenshot({ path: "tools/v015-files.png" })

  await browser.close()
  console.log(`\n${failures.length === 0 ? "ALL PASS" : failures.length + " FAILURES: " + failures.join(", ")}`)
  process.exit(failures.length === 0 ? 0 : 1)
}

main().catch((e) => {
  console.error("SCRIPT ERROR:", e.message)
  process.exit(2)
})
