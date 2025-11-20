// vite.config.js

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // --- ADD THIS CONFIGURATION BLOCK ---
  server: {
    // This setting ensures that Vite starts on the port we expect
    port: 5173,
    // This allows access from the local network, helpful for mobile testing
    host: true
  },
  // This is the CRITICAL part for nested projects like yours
  root: '.', 
  build: {
    // The directory where your build output will be placed (default is 'dist')
    outDir: 'dist',
    // The base directory for static assets (your index.html should be here)
    assetsDir: '.',
  }
  // ------------------------------------
});