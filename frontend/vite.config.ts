import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

const currentDirectory = path.dirname(fileURLToPath(import.meta.url))

// Vite 配置使用 ESM，显式从 import.meta.url 解析目录，兼容 Node 18+ 并避免 __dirname 弃用警告。
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify('1.0.0'),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      includeAssets: ['favicon.ico', 'offline.html'],
      manifest: {
        name: 'EquipSense — 工业设备智能监控',
        short_name: 'EquipSense',
        description: '工业设备智能监控与预测维护平台',
        theme_color: '#2563eb',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/dashboard',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      injectManifest: {
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(currentDirectory, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:8080', changeOrigin: true },
      '/hubs': { target: 'http://localhost:8080', ws: true, changeOrigin: true },
    },
  },
  build: {
    // 分包策略：将大型第三方库拆分为独立 chunk 以利用浏览器缓存
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/echarts')) return 'echarts'
          if (id.includes('node_modules/zrender')) return 'echarts' // echarts 内部依赖
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/') || id.includes('node_modules/react-router')) return 'react-vendor'
          if (id.includes('node_modules/@microsoft/signalr')) return 'signalr'
          if (id.includes('node_modules/react-hook-form') || id.includes('node_modules/@hookform') || id.includes('node_modules/zod')) return 'form-vendor'
        },
      },
    },
    // 单个 chunk 超过 1000KB 时警告（ECharts 无法再拆分）
    chunkSizeWarningLimit: 1000,
  },
})
