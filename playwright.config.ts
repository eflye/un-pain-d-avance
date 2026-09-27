import { defineConfig, devices } from '@playwright/test'
import 'dotenv/config'

/**
 * Tests de bout en bout, lancés dans le container Playwright :
 *   podman compose --profile e2e run --rm e2e
 * E2E_BASE_URL pointe alors sur le service « app » ; hors container, on vise localhost:3000.
 */
const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:3000'

export default defineConfig({
  testDir: './tests/e2e',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Le serveur de dev compile à la demande : un seul worker évite les compilations concurrentes.
  workers: 1,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    locale: 'fr-FR',
    timezoneId: 'Europe/Paris',
    trace: 'retain-on-failure',
    navigationTimeout: 60_000,
  },
  projects: [
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
  ],
})
