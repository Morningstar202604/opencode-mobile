#!/usr/bin/env node
/**
 * OpenCode Mobile — 本地开发验证服务器
 *
 * 用途：把构建后的 Web UI（dist/）以静态站点形式提供在 8190 端口，
 * 并把 /api 与 OpenCode v1 端点代理到本地 opencode serve（默认 8188）。
 * 在开发调试时用它替代 Android WebView 环境，方便用浏览器验证手机端 UI。
 *
 * 用法：node tools/static-server.cjs [--port 8190] [--backend 8188]
 */
const http = require("http")
const fs = require("fs")
const path = require("path")

const args = process.argv.slice(2)
const getArg = (name, def) => {
  const i = args.indexOf(name)
  return i >= 0 ? args[i + 1] : def
}
const PORT = Number(getArg("--port", "8190"))
const BACKEND = Number(getArg("--backend", "8188"))
const DIST = path.join(__dirname, "..", "dist")

// 需要代理到后端的 OpenCode v1 端点前缀
const PROXY_PREFIXES = [
  "/api/",
  "/session",
  "/config",
  "/auth",
  "/provider",
  "/model",
  "/project",
  "/event",
  "/message",
  "/agent",
  "/command",
  "/reference",
  "/global",
  "/path",
  "/pty",
  "/help",
]

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`)
  const pathname = decodeURIComponent(url.pathname)

  // 1) 代理到 OpenCode 后端
  if (PROXY_PREFIXES.some((p) => pathname.startsWith(p))) {
    const proxyReq = http.request(
      {
        host: "127.0.0.1",
        port: BACKEND,
        path: pathname + url.search,
        method: req.method,
        headers: { ...req.headers, host: `127.0.0.1:${BACKEND}` },
      },
      (proxyRes) => {
        const ct = proxyRes.headers["content-type"] || ""
        // v0.10 修复：v1 端点在 SPA fallback 时返回 200+text/html，需改写为 404 JSON
        if (proxyRes.statusCode === 200 && ct.includes("text/html") && PROXY_PREFIXES.some((p) => pathname.startsWith(p) && !pathname.startsWith("/project/"))) {
          res.writeHead(404, { "content-type": "application/json" })
          res.end(JSON.stringify({ error: { code: "endpoint_not_found", message: `${pathname} is not a v1 endpoint` } }))
          return
        }
        res.writeHead(proxyRes.statusCode || 502, proxyRes.headers)
        proxyRes.pipe(res)
      },
    )
    proxyReq.on("error", () => {
      res.writeHead(502, { "content-type": "application/json" })
      res.end(JSON.stringify({ error: { code: "backend_unreachable", message: `opencode serve (127.0.0.1:${BACKEND}) 未启动` } }))
    })
    proxyReq.end()
    return
  }

  // 2) 静态文件
  const safe = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, "")
  let file = path.join(DIST, safe)
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    file = path.join(DIST, "index.html")
  }
  fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(500, { "content-type": "text/plain; charset=utf-8" })
      res.end("500 internal error")
      return
    }
    const ext = path.extname(file).toLowerCase()
    res.writeHead(200, { "content-type": MIME[ext] || "application/octet-stream", "cache-control": "no-cache" })
    res.end(data)
  })
})

server.listen(PORT, "127.0.0.1", () => {
  console.log(`[static-server] serving ${DIST} on http://127.0.0.1:${PORT} (backend 127.0.0.1:${BACKEND})`)
})
