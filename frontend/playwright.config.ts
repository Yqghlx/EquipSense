import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'cd .. && dotnet run --project src/EquipAI.WebAPI -- --seed',
      port: 8080,
      reuseExistingServer: true,
      timeout: 60000,
      env: {
        ASPNETCORE_ENVIRONMENT: 'Development',
      },
    },
    {
      command: 'npm run dev',
      port: 5173,
      reuseExistingServer: true,
      timeout: 30000,
    },
  ],
});
