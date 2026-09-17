import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // Relative base so the built site works both at the domain root (dev / a
  // user page) and under a sub-path like https://<user>.github.io/<repo>/
  // (a GitHub Pages project site) with no repo-name hardcoding.
  base: "./",
  plugins: [react()],
  server: {
    port: process.env.PORT ? Number(process.env.PORT) : 5173,
    open: false,
  },
});
