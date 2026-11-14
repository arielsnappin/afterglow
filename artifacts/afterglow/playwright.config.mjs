import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig } from "@playwright/test";

// Never point a state-changing regression run at a published app.
const baseURL = process.env.AFTERGLOW_TEST_BASE_URL ?? "http://127.0.0.1/";
const target = new URL(baseURL);
if (!["localhost", "127.0.0.1", "[::1]"].includes(target.hostname)
  || !["http:", "https:"].includes(target.protocol)
  || target.pathname !== "/" || target.search || target.hash
  || target.username || target.password) {
  throw new Error("AFTERGLOW_TEST_BASE_URL must be a loopback root URL for the local preview proxy.");
}
const output = fileURLToPath(new URL("../../generated-artifacts/afterglow/", import.meta.url));
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
  ?? (existsSync("/repl/tools/bin/chromium") ? "/repl/tools/bin/chromium" : undefined);

export default defineConfig({
  testDir: "./tests/browser",
  outputDir: `${output}/results`,
  reporter: [
    ["list"],
    ["html", { outputFolder: `${output}/report`, open: "never" }],
  ],
  fullyParallel: true,
  workers: 2,
  forbidOnly: true,
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 8_000 },
  projects: ["dark", "light"].map(theme => ({ name: theme, use: { colorScheme: theme } })),
  use: {
    baseURL,
    browserName: "chromium",
    viewport: { width: 1280, height: 900 },
    timezoneId: "UTC",
    locale: "en-GB",
    serviceWorkers: "block",
    permissions: ["clipboard-read", "clipboard-write"],
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    launchOptions: executablePath ? { executablePath } : {},
  },
});
