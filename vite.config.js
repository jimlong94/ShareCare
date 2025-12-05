// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/', // 👈 CRITICAL: Forces absolute paths
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      workbox: {
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
      },
      manifest: {
        name: "The Zen Family Planner",
        short_name: "Zen Planner",
        description: "Secure logistics for family caregivers.",
        theme_color: "#0d9488",
        background_color: "#f8fafc",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        icons: [
          {
            src: "/icon-192.png",
            type: "image/png",
            sizes: "192x192"
          },
          {
            src: "/icon-512.png",
            type: "image/png",
            sizes: "512x512"
          }
        ]
      }
    })
  ],
  server: {
    port: 5173,
    host: true
  },
  build: {
    outDir: 'dist',
    // 👈 REMOVED: assetsDir: '.' (Let it default to 'assets' folder for cleaner structure)
    emptyOutDir: true, // 👈 NEW: Ensures we delete the old 'dist' folder before building
  }
});