import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tanstackRouter(),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Ensure Firebase is deduplicated - use the same instance for RxDB and our code
      'firebase/app': path.resolve(__dirname, './node_modules/firebase/app'),
      'firebase/firestore': path.resolve(__dirname, './node_modules/firebase/firestore'),
    },
    dedupe: ['firebase', 'firebase/app', 'firebase/firestore'],
  },
  optimizeDeps: {
    include: ['firebase/app', 'firebase/firestore'],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
    include: ['tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
  },
})
