import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "ai.opencode.mobile",
  appName: "OpenCode Mobile",
  webDir: "dist",
  server: {
    androidScheme: "https",
  },
  android: {
    allowMixedContent: true,
  },
  plugins: {
    // 打开外部链接走系统浏览器，避免 WebView 内跳转
    CapacitorHttp: {
      enabled: false,
    },
  },
};

export default config;
