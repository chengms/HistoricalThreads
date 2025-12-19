import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // 自定义域名部署：站点在根路径 / 下（不再使用 /HistoricalThreads/ 子路径）
  base: '/',
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
  build: {
    sourcemap: false, // 生产环境禁用 source map，避免调试器问题
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // 生产环境移除所有 console 语句
        drop_debugger: true, // 移除 debugger 语句
      },
    },
  },
})

