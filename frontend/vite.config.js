import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Change 'localhost' to your docker service container name 'uhi_backend'
const apiProxyTarget = process.env.VITE_API_PROXY_TARGET || 'http://uhi_backend:5000'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    proxy: {
      '/api': {
        target: apiProxyTarget,
        changeOrigin: true,
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})