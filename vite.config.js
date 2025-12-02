// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate', // 👈 Updates the app automatically when you deploy changes
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
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
  root: '.', 
  build: {
    outDir: 'dist',
    assetsDir: '.',
  }
});