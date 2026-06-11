import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

// Prevent unhandled stream/serialization/network errors from crashing the dev server process
if (typeof process !== "undefined") {
  process.on("uncaughtException", (err) => {
    if (
      err &&
      (err.message?.includes("Stream lifetime exceeded") ||
        err.message?.includes("Serialization timeout") ||
        err.message?.includes("Unhandled 'error' event") ||
        err.message?.includes("ECONNREFUSED"))
    ) {
      console.warn("[Vite Watchdog] Prevented crash from stream/connection error:", err.message);
      return;
    }
    console.error("Uncaught Exception:", err);
  });

  process.on("unhandledRejection", (reason) => {
    const msg = reason instanceof Error ? reason.message : String(reason);
    if (
      msg.includes("Stream lifetime exceeded") ||
      msg.includes("Serialization timeout") ||
      msg.includes("ECONNREFUSED")
    ) {
      console.warn("[Vite Watchdog] Prevented crash from unhandled rejection:", msg);
      return;
    }
    console.warn("Unhandled Rejection:", reason);
  });
}

export default defineConfig({
  plugins: [tanstackStart(), react(), tailwindcss(), tsconfigPaths()],
  resolve: {
    alias: {
      "@": path.resolve(rootDir, "src"),
    },
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "@tanstack/react-router",
      "@tanstack/react-query",
    ],
  },
  server: {
    port: 8081,
    strictPort: true,
    host: true,
    proxy: {
      "/admin-api": {
        target: "http://127.0.0.1:8082",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/admin-api/, ""),
        configure: (proxy, _options) => {
          proxy.on("error", (err, _req, res) => {
            console.warn("Proxy error connecting to Admin API:", err.message);
            if (!res.headersSent && typeof res.writeHead === "function") {
              res.writeHead(502, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ error: "Admin API connection refused" }));
            }
          });
        },
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("recharts") || id.includes("d3")) {
              return "charts";
            }
            if (id.includes("reactflow")) {
              return "reactflow";
            }
            if (id.includes("leaflet")) {
              return "maps";
            }
            if (id.includes("firebase")) {
              return "firebase";
            }
            if (id.includes("framer-motion")) {
              return "framer-motion";
            }
            return "vendor";
          }
        },
      },
    },
  },
  optimizeDeps: {
    include: ["react", "react-dom", "framer-motion"],
  },
  esbuild: {
    drop: ["console", "debugger"],
  },
});
