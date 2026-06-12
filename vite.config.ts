import { defineConfig, loadEnv } from "vite";
import type { PluginOption, Connect } from "vite";
import react from "@vitejs/plugin-react";

// ─── ベーシック認証ミドルウェア ───
function basicAuthMiddleware(user: string, pass: string): Connect.NextHandleFunction {
  const expected = "Basic " + Buffer.from(`${user}:${pass}`).toString("base64");
  return (req, res, next) => {
    const header = req.headers["authorization"];
    if (header === expected) {
      next();
      return;
    }
    res.statusCode = 401;
    res.setHeader("WWW-Authenticate", 'Basic realm="kanden-subsidy-demo", charset="UTF-8"');
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.end("Authentication required");
  };
}

function basicAuthPlugin(user: string, pass: string): PluginOption {
  return {
    name: "basic-auth",
    enforce: "pre",
    configureServer(server) {
      server.middlewares.use(basicAuthMiddleware(user, pass));
    },
    configurePreviewServer(server) {
      server.middlewares.use(basicAuthMiddleware(user, pass));
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const user = env.BASIC_AUTH_USER || "test";
  const pass = env.BASIC_AUTH_PASS || "test";

  return {
    plugins: [basicAuthPlugin(user, pass), react()],
    server: {
      port: 5173,
      host: true,
      strictPort: true,
      allowedHosts: [".replit.dev"],
      hmr: { clientPort: 443 },
      proxy: {
        // 同一オリジン化: /api/* を Express (:3001) に転送
        // → ブラウザは :5173 だけ見ればよく、ベーシック認証も1回で済む
        "/api": {
          target: "http://localhost:3001",
          changeOrigin: true,
        },
      },
    },
  };
});
