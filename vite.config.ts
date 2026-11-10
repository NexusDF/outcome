import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import type { Plugin } from "vite";
import { defineConfig } from "vitest/config";

const pagesBase = process.env.PAGES_BASE?.trim();

// GitHub Pages redirects /outcome to /outcome/. Android will not open an
// installed PWA when start_url redirects, so the launch URL is index.html.
function absolutePwaManifest(): Plugin {
  let manifestFile = "";
  let scope = "/";

  return {
    name: "absolute-pwa-manifest",
    apply: "build",
    configResolved(config) {
      scope = config.base.endsWith("/") ? config.base : `${config.base}/`;
      manifestFile = resolve(config.root, config.build.outDir, "manifest.webmanifest");
    },
    closeBundle() {
      const manifest = JSON.parse(readFileSync(manifestFile, "utf8")) as {
        icons?: { src: string }[];
      };
      const absolute = (value: string) => {
        if (value.startsWith("/") || /^https?:\/\//.test(value)) return value;
        return `${scope}${value.replace(/^\.\//, "")}`;
      };

      const next = {
        ...manifest,
        id: scope,
        scope,
        start_url: `${scope}index.html`,
        icons: manifest.icons?.map((icon) => ({ ...icon, src: absolute(icon.src) })),
      };
      writeFileSync(manifestFile, `${JSON.stringify(next, null, 2)}\n`);
    },
  };
}

export default defineConfig({
  base: pagesBase && pagesBase.length > 0 ? pagesBase : "/",
  plugins: [react(), tailwindcss(), absolutePwaManifest()],
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
