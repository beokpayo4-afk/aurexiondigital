import path from "node:path";
import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, rootDir, "");
  const apiTarget = (env.VITE_API_BASE_URL || "http://127.0.0.1:8001/api").replace(/\/api(?:\/v1)?\/?$/, "");

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(rootDir, "src"),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("node_modules/framer-motion")) {
              return "motion";
            }
            if (id.includes("node_modules/react") || id.includes("node_modules/scheduler")) {
              return "react";
            }
          },
        },
      },
    },
    server: {
      port: 5173,
      proxy: {
        "/sitemap.xml": { target: apiTarget, changeOrigin: true },
      },
    },
    preview: {
      proxy: {
        "/sitemap.xml": { target: apiTarget, changeOrigin: true },
      },
    },
  };
});
