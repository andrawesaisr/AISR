import { defineConfig, devices } from '@playwright/test';
import path from 'path';

envDefaults();

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60 * 1000,
  expect: {
    timeout: 10 * 1000,
  },
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: process.env.CI ? 'retain-on-failure' : 'off',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'npm run dev',
      port: 3000,
      reuseExistingServer: !process.env.CI,
      cwd: path.resolve(__dirname),
      env: {
        ...process.env,
        NODE_ENV: 'test',
      },
    },
    {
      command: 'npm run dev',
      port: 5001,
      reuseExistingServer: !process.env.CI,
      cwd: path.resolve(__dirname, '../server'),
      env: {
        ...process.env,
        NODE_ENV: 'test',
        DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/aisr_e2e',
      },
    },
  ],
});

function envDefaults() {
  process.env.DATABASE_URL =
    process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/aisr_e2e';
  process.env.E2E_BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000';
}
