import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const currentDirectory = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    exclude: ['**/e2e-comprehensive/**', '**/node_modules/**'],
    // 覆盖率采集：仅 [vitest run --coverage] 触发，不影响常规 [npm run test]。
    // threshold 为下限门禁（ratchet 棘轮机制）— 2026-08-14 复核基线：行 84.41%、
    // 函数 80.14%；新增业务页面后应及时补充测试，避免函数覆盖率跌破门禁。
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'json-summary'],
      // 排除非业务代码：测试夹具、类型定义、入口引导（main.tsx 由 E2E 覆盖）
      exclude: [
        'src/test/**',
        'src/types/**',
        'src/main.tsx',
        'src/vite-env.d.ts',
        '**/*.d.ts',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(currentDirectory, './src'),
    },
  },
})
