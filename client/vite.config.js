import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://smart-dashboard-7382.onrender.com', // ส่งไปที่ Backend
        changeOrigin: true,
        secure: false
      },
    },
  },
})