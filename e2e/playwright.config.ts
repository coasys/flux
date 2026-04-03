import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  timeout: 300_000,
  retries: 1,
  use: {
    baseURL: 'https://deploy-preview-580--fluxsocial-dev.netlify.app',
    headless: true,
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
});
