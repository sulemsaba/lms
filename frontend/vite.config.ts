import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/icon-192.png", "icons/icon-512.png"],
      manifest: {
        name: "UDSM Student Hub",
        short_name: "Student Hub",
        theme_color: "#4f46e5",
        background_color: "#f3f4f6",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,svg,ico}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.hub\.udsm\.ac\.tz\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "udsm-api-cache",
              networkTimeoutSeconds: 6
            }
          },
          {
            urlPattern: /^https:\/\/.*\/tiles\/.*/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "udsm-map-tiles"
            }
          }
        ],
        navigateFallback: "/offline-fallback.html"
      }
    })
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src")
    }
  }
});
