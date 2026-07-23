import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// Backend manzili env orqali sozlanadi. Barcha panellar (admin, biznes,
// kassir, landing va mobil ilova) endi bitta backendga — 8000-portga ulanadi;
// avvalgi alohida admin backend (8001) yo'q.
const BACKEND_URL = process.env.VITE_BACKEND_URL || 'http://localhost:8000'
// Standart 5174 (landing 5173, biznes/kassir 5175 bilan to'qnashmasin).
const DEV_PORT = Number(process.env.PORT) || 5174

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true,
    port: DEV_PORT,
    strictPort: true,
    proxy: {
      '/api': {
        target: BACKEND_URL,
        changeOrigin: true,
      },
    },
  },
})
