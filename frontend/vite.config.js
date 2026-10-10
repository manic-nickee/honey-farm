import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parse } from "dotenv";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const environment = mode === "development" ? "local" : mode;
  const envFile = resolve(process.cwd(), ".env", `env.${environment}`);
  const fileEnv = parse(readFileSync(envFile));
  const env = Object.fromEntries(
    Object.entries(fileEnv).filter(([key]) => key.startsWith("VITE_")),
  );
  const define = Object.fromEntries(
    Object.entries(env).map(([key, value]) => [
      `import.meta.env.${key}`,
      JSON.stringify(value),
    ]),
  );

  return {
    plugins: [react()],
    define,
    server: {
      port: 5173,
      proxy: {
        "/api": {
          target: env.VITE_API_URL,
          changeOrigin: true,
        },
      },
    },
  };
});
