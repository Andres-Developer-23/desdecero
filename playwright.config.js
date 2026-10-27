import { defineConfig, devices } from "@playwright/test";

/**
 * Pruebas en navegador de dist/index.html (ejecuta antes `npm run build`).
 * Las librerías de los CDN se sirven desde node_modules: ver tests/e2e/fixtures.js.
 */
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: {
    baseURL: "https://desdecero.test",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "escritorio",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
    { name: "movil", use: { ...devices["Pixel 7"] }, testMatch: /interfaz\.spec\.js/ },
  ],
});
