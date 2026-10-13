// Browser tests (Playwright). `npm run e2e` builds dist-test/ (the Pages build plus window.__T hooks),
// serves it with `vite preview` and runs e2e/*.spec.js on a desktop and a phone profile.
import { defineConfig, devices } from '@playwright/test';

const CI = !!process.env.CI;
const PORT = 4179;
export default defineConfig({
  testDir: 'e2e',
  timeout: 120_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  workers: CI ? 2 : 4,
  retries: CI ? 1 : 0,
  reporter: CI ? [['list'], ['github'], ['html', { open: 'never' }]] : 'list',   // github: failures show up as annotations on the run
  use: {
    baseURL: `http://127.0.0.1:${PORT}/`,
    reducedMotion: 'reduce',             // the game shortens animations under reduced motion, so duels run fast
    acceptDownloads: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    // this sandbox ships Chromium under /opt/pw-browsers; CI downloads its own with `npx playwright install`
    launchOptions: process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {},
  },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1280, height: 860 } }, testIgnore: /\.phone\.spec\.js/ },
    { name: 'phone', use: { ...devices['Pixel 7'], browserName: 'chromium' }, testMatch: /\.(phone|both)\.spec\.js/ },
  ],
  webServer: {
    command: `npx vite preview --mode test --outDir dist-test --port ${PORT} --strictPort --host 127.0.0.1`,
    url: `http://127.0.0.1:${PORT}/`,
    reuseExistingServer: !CI,
    timeout: 60_000,
  },
});
