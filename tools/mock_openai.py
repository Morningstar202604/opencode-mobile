#!/usr/bin/env python3
"""Mock OpenAI-compatible SSE server with reasoning + tool_calls + rich markdown."""
import json, time
from http.server import BaseHTTPRequestHandler, HTTPServer

MD = """## 项目结构分析

我分析了你的代码文件，结论如下：

- **入口**：`App.tsx` 负责全局状态与页面路由
- **API 层**：`api.ts` 通过 SSE 直连你的 OpenAI 兼容端点

### 示例代码

```tsx
export default function App() {
  return <div className="app">Hello OpenCode Mobile</div>
}
```

### 数据对比

| 项目 | 说明 | 状态 |
| --- | --- | --- |
| 本地会话 | 存于手机本机 | ✅ |
| 模型连接 | 完全自定义 | ✅ |

> 提示：这是由 mock 服务生成的示例回复，仅用于验证 Markdown 渲染。"""

class H(BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.end_headers()

    def do_GET(self):
        if self.path.startswith("/v1/models"):
            body = json.dumps({"object": "list", "data": [{"id": "mock-model", "object": "model"}]})
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(body.encode())
            return
        self.send_response(404)
        self.end_headers()

    def do_POST(self):
        self.send_response(200)
        self.send_header("Content-Type", "text/event-stream")
        self.send_header("Cache-Control", "no-cache")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()

        def ev(obj):
            self.wfile.write(f"data: {json.dumps(obj, ensure_ascii=False)}\n\n".encode())
            self.wfile.flush()

        for piece in ["用户", "想看", "Markdown 渲染效果", "，我", "先梳理", "一下结构。"]:
            ev({"choices": [{"delta": {"reasoning_content": piece}}]})
            time.sleep(0.05)
        ev({"choices": [{"delta": {"tool_calls": [{"index": 0, "function": {"name": "get", "arguments": ""}}]}}]})
        time.sleep(0.05)
        ev({"choices": [{"delta": {"tool_calls": [{"index": 0, "function": {"name": "get_current_weather", "arguments": ""}}]}}]})
        time.sleep(0.05)
        for ch in MD:
            ev({"choices": [{"delta": {"content": ch}}]})
            time.sleep(0.002)
        ev({"choices": [{"delta": {}, "finish_reason": "stop"}]})
        ev({"choices": [], "finish_reason": "stop"})
        self.wfile.write(b"data: [DONE]\n\n")
        self.wfile.flush()

if __name__ == "__main__":
    HTTPServer(("127.0.0.1", 9017), H).serve_forever()
