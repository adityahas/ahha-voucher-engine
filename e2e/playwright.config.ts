import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './api',
  timeout: 30000,
  retries: 1,
  use: {
    baseURL: process.env.API_BASE_URL || 'http://localhost:9002',
    extraHTTPHeaders: {
      'Content-Type': 'application/json',
    },
  },
  reporter: [
    ['list'],
    ['junit', { outputFile: 'playwright-report/junit.xml' }],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],
});
