import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Dynamic base for GitHub Pages
  // - User/Org site (<user>.github.io): base '/'
  // - Project site: base '/<repo>/'
  base: (() => {
    const repo = process.env.GITHUB_REPOSITORY?.split("/")[1] || "";
    return repo.endsWith(".github.io") ? "/" : repo ? `/${repo}/` : "/";
  })(),
});
