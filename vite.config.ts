import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Dev proxy forwards /api + /actuator to the backend (avoids CORS in dev).
// Production: serve the built app behind the same origin, or enable CORS on the backend.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://stockintel-api-new-b7bafzh6hhb9edhq.centralindia-01.azurewebsites.net',
        changeOrigin: true,
      },
      '/actuator': {
        target: 'https://stockintel-api-new-b7bafzh6hhb9edhq.centralindia-01.azurewebsites.net',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 4173,
  },
})
