import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './bdd/tests',
  testMatch: '**/*.spec.ts',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  ],
  webServer: {
    command: 'npm --prefix apps/frontend run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
