import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    // KONFIGURASI PROXY (PENTING AGAR LOCALHOST JALAN)
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // Arahkan ke Backend Node.js
        changeOrigin: true,
        secure: false,
      }
    }
  }
})