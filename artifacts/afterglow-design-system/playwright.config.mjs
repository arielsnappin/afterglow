import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from '@playwright/test';

// Use the managed artifact workflow through the shared proxy, never the API or
// the live product. A loopback override supports a local CI reverse proxy.
const baseURL = process.env.DS_TEST_BASE_URL
  ?? 'http://127.0.0.1/afterglow-design-system/';
const target = new URL(baseURL);
if (!['localhost', '127.0.0.1', '[::1]'].includes(target.hostname)
  || !['http:', 'https:'].includes(target.protocol)
  || target.pathname !== '/afterglow-design-system/'
  || target.search || target.hash || target.username || target.password) {
  throw new Error('DS_TEST_BASE_URL must be a local /afterglow-design-system/ URL, not a live app.');
}

const outputRoot = fileURLToPath(new URL('../../generated-artifacts/design-system/', import.meta.url));
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
  ?? (existsSync('/repl/tools/bin/chromium') ? '/repl/tools/bin/chromium' : undefined);

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.mjs',
  outputDir: `${outputRoot}/results`,
  reporter: [
    ['list'],
    ['html', { outputFolder: `${outputRoot}/report`, open: 'never' }],
  ],
  fullyParallel: true,
  workers: 2,
  forbidOnly: true,
  retries: 0,
  timeout: 30_000,
  expect: { timeout: 5_000 },
  use: {
    baseURL,
    browserName: 'chromium',
    viewport: { width: 1280, height: 900 },
    reducedMotion: 'no-preference',
    serviceWorkers: 'block',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: executablePath ? { executablePath } : {},
  },
});
