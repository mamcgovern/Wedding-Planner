import {
  copyFileSync,
} from "node:fs";

import {
  resolve,
} from "node:path";

import react from "@vitejs/plugin-react";

import {
  defineConfig,
} from "vite";

function githubPagesSpaFallback() {
  return {
    name: "github-pages-spa-fallback",

    closeBundle() {
      const indexPath =
        resolve(
          process.cwd(),
          "dist",
          "index.html"
        );

      const fallbackPath =
        resolve(
          process.cwd(),
          "dist",
          "404.html"
        );

      copyFileSync(
        indexPath,
        fallbackPath
      );
    },
  };
}

export default defineConfig({
  base: "/",

  plugins: [
    react(),
    githubPagesSpaFallback(),
  ],
});