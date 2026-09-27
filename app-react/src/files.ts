import { Capacitor } from "@capacitor/core"
import { Directory, Filesystem } from "@capacitor/filesystem"

export interface CodeFile {
  name: string
  content: string
  updatedAt: number
}

const LS_KEY = "ocm.codefiles.v1"

function isNative(): boolean {
  return Capacitor.getPlatform() !== "web"
}

/** 读取全部代码文件：真机走 Filesystem 私有目录，浏览器降级 localStorage */
export async function listCodeFiles(): Promise<CodeFile[]> {
  if (!isNative()) {
    try {
      const raw = localStorage.getItem(LS_KEY)
      return raw ? (JSON.parse(raw) as CodeFile[]) : []
    } catch {
      return []
    }
  }
  try {
    const result = await Filesystem.readdir({ path: "", directory: Directory.Documents })
    const files = await Promise.all(
      result.files
        .filter((f) => f.type === "file" && f.name.endsWith(".ocm"))
        .map(async (f) => {
          const uri = await Filesystem.getUri({ path: f.name, directory: Directory.Documents })
          const read = await Filesystem.readFile({ path: uri.uri })
          let content: string
          if (typeof read.data === "string") {
            content = read.data
          } else {
            const buf = await (read.data as Blob).arrayBuffer()
            content = new TextDecoder().decode(buf)
          }
          return {
            name: f.name.replace(/\.ocm$/, ""),
            content,
            updatedAt: Date.now(),
          } as CodeFile
        }),
    )
    return files.sort((a, b) => b.updatedAt - a.updatedAt)
  } catch {
    return []
  }
}

/** 保存代码文件（name 不带扩展名时自动补 .ocm） */
export async function saveCodeFile(file: CodeFile): Promise<void> {
  const safeName = file.name.trim() || "untitled"
  if (!isNative()) {
    const all = (await listCodeFiles()).filter((f) => f.name !== safeName)
    all.push({ ...file, name: safeName, updatedAt: Date.now() })
    localStorage.setItem(LS_KEY, JSON.stringify(all))
    return
  }
  const path = `${safeName}.ocm`
  const uri = await Filesystem.getUri({ path, directory: Directory.Documents }).catch(() => null)
  if (uri) {
    await Filesystem.writeFile({ path: uri.uri, data: file.content })
  } else {
    await Filesystem.writeFile({ path, data: file.content, directory: Directory.Documents })
  }
}

export async function deleteCodeFile(name: string): Promise<void> {
  if (!isNative()) {
    const all = (await listCodeFiles()).filter((f) => f.name !== name)
    localStorage.setItem(LS_KEY, JSON.stringify(all))
    return
  }
  try {
    const uri = await Filesystem.getUri({ path: `${name}.ocm`, directory: Directory.Documents })
    await Filesystem.deleteFile({ path: uri.uri })
  } catch {
    // already gone
  }
}

/** 原生环境是否可用（用于 UI 提示） */
export function filesNative(): boolean {
  return isNative()
}
