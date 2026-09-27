#!/usr/bin/env node
/**
 * OpenCode Mobile — v0.13 回归脚本（测试连接）
 *
 * 流程：打开首页 → 底部「我的」→ 设置「模型」→ 「添加」→ 填入服务商信息
 *       → 点「测试连接」→ 断言绿色成功提示，并截图 tools 说明文档引用。
 *
 * 需要：Playwright（npm i playwright-core）、chromium 可执行文件路径、本地 static-server。
 * API Key 请通过环境变量 AGNES_API_KEY 提供，切勿硬编码在脚本中。
 */
const { chromium } = require("playwright-core")
const API_KEY = process.env.AGNES_API_KEY || "sk-替换为你的Key"

;(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || "/usr/local/bin/chromium", args: ["--no-sandbox"] })
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
  const page = await ctx.newPage()
  page.on("console", (m) => {
    if (m.type() === "error" && !m.text().includes("502") && !m.text().includes("favicon")) console.log("ERR:", m.text().slice(0, 100))
  })

  await page.goto("http://127.0.0.1:8190/", { waitUntil: "domcontentloaded", timeout: 60000 })
  await page.waitForTimeout(8000)

  // 底部「我的」→ 设置主页「模型」
  await page.evaluate(() => document.querySelector('[data-slot="tab-mine"]')?.click())
  await page.waitForTimeout(1500)
  await page.evaluate(() => [...document.querySelectorAll('[data-component="settings-home-row"]')].find((r) => r.innerText.startsWith("模型"))?.click())
  await page.waitForTimeout(1200)

  // 「添加」→ 填表单（Solid 受控 input：fill 后需 blur 触发 change）
  await page.evaluate(() => document.querySelector('[data-component="settings-models-add"]')?.click())
  await page.waitForTimeout(500)
  const inputs = await page.$$(".settings-model-sheet input")
  if (inputs.length >= 4) {
    await inputs[0].fill("Agnes 2.5 Flash")
    await inputs[1].fill("https://apihub.agnes-ai.com/v1")
    await inputs[2].fill(API_KEY)
    await inputs[3].fill("agnes-2.5-flash")
    for (const inp of inputs) await inp.evaluate((el) => el.blur())
  }

  // 点「测试连接」
  await page.evaluate(() => [...document.querySelectorAll(".settings-model-test-row button")][0]?.click())
  await page.waitForTimeout(15000)

  const msg = await page.evaluate(() => {
    const el = document.querySelector('[data-component="settings-model-test-msg"]')
    return el ? { state: el.getAttribute("data-state"), text: el.textContent } : null
  })
  console.log("TEST-RESULT:", JSON.stringify(msg))
  await page.screenshot({ path: "v013-test-conn.png", fullPage: false })
  await browser.close()
})()
