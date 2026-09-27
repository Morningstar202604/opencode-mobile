// OpenCode Mobile v0.15 — 真模型（Agnes AI）全链路验证 v2
const { chromium } = require("playwright")

const BASE = "http://127.0.0.1:8190/"
const AGNES = {
  baseURL: "https://apihub.agnes-ai.com/v1",
  apiKey: "sk-EfosNIDbrzJ5Irxu6ZWCnh06lcs46dDPL2SsoYVJz3P35Rpu",
  modelId: "agnes-2.5-flash",
}

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
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
  page.on("pageerror", (e) => console.log("PAGEERROR:", e.message))

  await page.goto(BASE, { waitUntil: "networkidle" })
  await page.evaluate(() => localStorage.clear())
  await page.reload({ waitUntil: "networkidle" })
  await page.waitForTimeout(500)

  // 1) 添加 Agnes 模型
  await page.getByText("我的", { exact: true }).click()
  await page.waitForTimeout(300)
  await page.getByText("添加模型", { exact: true }).click()
  await page.waitForTimeout(300)
  await page.getByPlaceholder("GPT-4o mini").fill("Agnes Flash")
  await page.getByPlaceholder("https://api.example.com/v1").fill(AGNES.baseURL)
  await page.getByPlaceholder("sk-...").fill(AGNES.apiKey)
  await page.getByPlaceholder("gpt-4o-mini / deepseek-chat").fill(AGNES.modelId)

  // 2) 测试连接（真实请求，慢网络需耐心）
  await page.getByText("测试连接", { exact: true }).click()
  let body = ""
  for (let i = 0; i < 16; i++) {
    await page.waitForTimeout(5000)
    body = await page.evaluate(() => document.body.innerText)
    if (body.includes("✓")) break
  }
  check("测试连接成功（绿色 ✓）", body.includes("✓"), body.slice(-160).replace(/\n/g, " "))

  // 3) 保存并设为默认
  await page.getByText("保存", { exact: true }).last().click()
  await page.waitForTimeout(500)
  body = await page.evaluate(() => document.body.innerText)
  check("模型已保存", body.includes("Agnes Flash"))

  // 4) 真对话（SSE 流式）
  await page.getByText("对话", { exact: true }).click()
  await page.waitForTimeout(300)
  await page.locator("nav button").nth(2).click()
  await page.waitForTimeout(400)
  await page.fill("textarea", "用一句话介绍你自己，并回答 1+1 等于几")
  await page.keyboard.press("Enter")
  body = ""
  for (let i = 0; i < 20; i++) {
    await page.waitForTimeout(5000)
    body = await page.evaluate(() => document.body.innerText)
    if (body.includes("2") && body.length > 200) break
  }
  check(
    "收到真实回复（含 1+1=2）",
    body.includes("2") && !body.includes("测试连接") || body.includes("等于 2") || body.includes("= 2"),
    body.slice(-240).replace(/\n/g, " "),
  )

  await page.screenshot({ path: "tools/v015-agnes-chat.png" })
  await browser.close()
  console.log(`\n${failures.length === 0 ? "ALL PASS" : failures.length + " FAILURES: " + failures.join(", ")}`)
  process.exit(failures.length === 0 ? 0 : 1)
}

main().catch((e) => {
  console.error("SCRIPT ERROR:", e.message)
  process.exit(2)
})
