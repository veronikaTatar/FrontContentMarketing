import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    historyApiFallback: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true,
      },
      // ← ИСПРАВЛЕНО: убрали /oauth2 из прокси
      // '/oauth2': {
      //   target: 'http://localhost:8081',
      //   changeOrigin: true,
      // }
    }
  }
})