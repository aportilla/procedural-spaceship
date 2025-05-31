/// <reference types="vitest" />
import { defineConfig } from 'vite'

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 1000, // Increase limit since Three.js is large
    rollupOptions: {
      output: {
        manualChunks: {
          // Split Three.js into its own chunk for better caching
          'three': ['three']
        }
      }
    }
  },
  server: {
    port: 3000,
    open: true
  },
  test: {
    environment: 'jsdom'
  }
})