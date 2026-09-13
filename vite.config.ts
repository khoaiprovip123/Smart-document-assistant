import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { getHttpsServerOptions } from "office-addin-dev-certs";
import { resolve } from "node:path";

export default defineConfig(async () => {
  const https = await getHttpsServerOptions();

  return {
    plugins: [react()],
    server: {
      host: "0.0.0.0",
      port: 3000,
      strictPort: true,
      https,
      headers: {
        "Access-Control-Allow-Origin": "*"
      }
    },
    build: {
      rollupOptions: {
        input: {
          taskpane: resolve(__dirname, "taskpane.html"),
          commands: resolve(__dirname, "commands.html")
        }
      }
    },
    test: {
      environment: "node"
    }
  };
});
