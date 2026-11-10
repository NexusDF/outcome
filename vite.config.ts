import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const pagesBase = process.env.PAGES_BASE?.trim();

export default defineConfig({
  base: pagesBase && pagesBase.length > 0 ? pagesBase : "/",
  plugins: [react(), tailwindcss()],
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
