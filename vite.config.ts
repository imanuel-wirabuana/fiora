import { resolve } from "node:path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { VitePWA } from "vite-plugin-pwa"

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      registerType: "autoUpdate",
      includeAssets: [
        "favicon.ico",
        "favicon.png",
        "apple-touch-icon.png",
        "notification-badge.png",
      ],
      manifest: {
        name: "Fiora - Couple Connection & Mood Tracker",
        short_name: "Fiora",
        description:
          "Private mood tracking, connection, and relationship timeline for couples.",
        theme_color: "#FAFAFB",
        background_color: "#FAFAFB",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        scope: "/",
        icons: [
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/pwa-maskable-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      injectManifest: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        globIgnores: [
          "**/*-cyrillic*.woff2",
          "**/*-greek*.woff2",
          "**/*-vietnamese*.woff2",
        ],
      },
    }),
  ],
  build: {
    rolldownOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (
              id.includes("node_modules/react/") ||
              id.includes("node_modules/react-dom/") ||
              id.includes("node_modules/wouter/")
            ) {
              return "vendor-react"
            }
            if (id.includes("node_modules/@supabase/")) {
              return "vendor-supabase"
            }
            if (id.includes("node_modules/@tanstack/")) {
              return "vendor-query"
            }
            if (id.includes("node_modules/lucide-react/")) {
              return "vendor-icons"
            }
            if (id.includes("node_modules/date-fns/")) {
              return "vendor-date"
            }
            if (id.includes("node_modules/leaflet/")) {
              return "vendor-leaflet"
            }
          }
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": resolve(import.meta.dirname, "./src"),
    },
  },
})
