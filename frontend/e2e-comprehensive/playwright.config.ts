/**
 * E2E 全面测试 Playwright 配置
 *
 * 针对 Docker Compose 生产环境（https://localhost:8443），
 * 配置忽略 HTTPS 证书错误，使用 Chromium 浏览器。
 */
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [['html', { outputFolder: 'test-results/html' }], ['list']],
  timeout: 60000,
  expect: {
    // CI 环境较慢（共享 CPU + 冷启动），适当增加断言超时
    timeout: 15000,
  },
  use: {
    // CI 中使用 PLAYWRIGHT_BASE_URL 环境变量（http://localhost:5173），
    // 本地 Docker Compose 环境使用默认的 https://localhost:8443
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'https://localhost:8443',
    ignoreHTTPSErrors: true,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'setup',
      testMatch: /00-setup\/.*\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'auth',
      testMatch: /01-auth\/.*\.spec\.ts/,
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'crud',
      testMatch: /02-crud\/.*\.spec\.ts/,
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'realtime',
      testMatch: /03-realtime\/.*\.spec\.ts/,
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'advanced',
      testMatch: /04-advanced\/.*\.spec\.ts/,
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'errors',
      testMatch: /05-error-handling\/.*\.spec\.ts/,
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'edge',
      testMatch: /06-edge-cases\/.*\.spec\.ts/,
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  outputDir: 'test-results/artifacts',
});
