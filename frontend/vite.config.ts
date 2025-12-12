import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // 如果设置了自定义域名，base 应该是 '/'，否则使用 '/HistoricalThreads/'
  // 可以通过环境变量 VITE_USE_CUSTOM_DOMAIN=true 来启用自定义域名模式
  base: process.env.VITE_USE_CUSTOM_DOMAIN === 'true' 
    ? '/' 
    : (process.env.NODE_ENV === 'production' ? '/HistoricalThreads/' : '/'),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})

