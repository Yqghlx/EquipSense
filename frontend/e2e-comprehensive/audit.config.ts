/**
 * 页面实测审计专用 Playwright 配置
 *
 * 独立于主 e2e-comprehensive 套件，不纳入 CI。
 * 用于手动逐页审计所有业务页面的实际可用性。
 */
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './99-manual-audit',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [['list']],
  timeout: 120000,
  expect: { timeout: 15000 },
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'https://localhost:8443',
    ignoreHTTPSErrors: true,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'audit',
      testMatch: /.*\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  outputDir: 'test-results/audit-artifacts',
});
