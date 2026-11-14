import { randomBytes } from "node:crypto";
import { test as base, expect } from "@playwright/test";

const allowedApi = (method, path) =>
  (method === "GET" && ["/api/workspace", "/api/summary"].includes(path))
  || (method === "POST" && ["/api/demo/commit", "/api/demo/advance", "/api/demo/reset"].includes(path))
  || (method === "PATCH" && (path === "/api/preferences" || /^\/api\/people\/demo-u\d+$/.test(path)));

export const test = base.extend({
  // No storageState, credentials, existing browser cookie or real uploads.
  // Set the isolated cookie BEFORE concurrent workspace/summary loads.
  workspace: [async ({ context, baseURL }, use) => {
    const target = new URL(baseURL);
    const id = randomBytes(32).toString("hex");
    await context.addCookies([{
      name: "afterglow_demo", value: id, domain: target.hostname, path: "/api",
      httpOnly: true, sameSite: "Strict", secure: target.protocol === "https:",
    }]);
    const request = async (path, { method = "GET", data } = {}) => {
      if (!allowedApi(method, `/api${path}`)) throw new Error(`Forbidden test API call: ${method} ${path}`);
      const cookies = await context.cookies(`${target.origin}/api/workspace`);
      expect(cookies.find(c => c.name === "afterglow_demo")?.value, "Only this test's cookie may be used").toBe(id);
      const response = await context.request.fetch(`${target.origin}/api${path}`, {
        method, data, maxRedirects: 0,
      });
      expect(response.ok(), `${method} ${path}: ${response.status()}`).toBe(true);
      return response.json();
    };
    // A deliberately non-default original snapshot catches reset-to-seed bugs.
    await request("/workspace");
    await request("/preferences", {
      method: "PATCH", data: { goal: "Synthetic pre-import snapshot", interests: ["Community"] },
    });
    const original = await request("/workspace");
    await request("/demo/commit", { method: "POST", data: { source: "provider" } });
    await request("/demo/advance", { method: "POST", data: { chapter: 0 } });
    expect((await request("/workspace")).journey.chapter).toBe(1);
    try {
      await use({ request, original });
    } finally {
      // Only this browser's synthetic edits are reset, even on assertion failure.
      await request("/demo/reset", { method: "POST", data: { confirm: true } });
    }
  }, { auto: true }],
  page: async ({ page, context, baseURL, colorScheme, workspace }, use) => {
    const target = new URL(baseURL);
    const forbidden = [];
    const errors = [];
    const failedApi = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("response", response => {
      if (new URL(response.url()).pathname.startsWith("/api/") && !response.ok()) {
        failedApi.push(`${response.status()} ${response.request().method()} ${new URL(response.url()).pathname}`);
      }
    });
    await context.addInitScript(theme => localStorage.setItem("afterglow-app-theme", theme), colorScheme);
    await context.route("**/*", async route => {
      const req = route.request();
      const url = new URL(req.url());
      // Avoid CDN availability/font timing as a source of nondeterminism.
      if (["fonts.googleapis.com", "fonts.gstatic.com"].includes(url.hostname)) return route.abort();
      const api = url.pathname.startsWith("/api/");
      if (url.origin !== target.origin
        || (api ? !allowedApi(req.method(), url.pathname) : !["GET", "HEAD"].includes(req.method()))
        || /multipart\/form-data/i.test(req.headers()["content-type"] ?? "")) {
        forbidden.push(`${req.method()} ${url.origin}${url.pathname}`);
        return route.abort();
      }
      return route.continue();
    });
    await use(page);
    await expect(page.locator("html")).toHaveClass(new RegExp(`\\b${colorScheme}\\b`));
    expect(forbidden, "No external requests, uploads or non-synthetic mutations").toEqual([]);
    expect(errors, "No uncaught browser exceptions").toEqual([]);
    expect(failedApi, "All application API calls must succeed").toEqual([]);
  },
});
export { expect };

export async function openFollowUps(page) {
  await page.goto("/follow-ups");
  await expect(page.getByTestId("button-reach-out-demo-u0")).toBeVisible();
}

export async function openPerson(page, id = "demo-u0") {
  // Wait for the prior Radix exit animation/focus restoration before reopening.
  await expect(page.getByTestId("sheet-person")).toHaveCount(0);
  await page.getByTestId(`button-reach-out-${id}`).click();
  await expect(page.getByTestId("sheet-person")).toBeVisible();
}

export async function savePerson(page) {
  await page.getByTestId("button-save-person").click();
  await expect(page.getByTestId("button-save-person")).toBeDisabled();
  await expect(page.getByTestId("sheet-person").getByText("All saved", { exact: true })).toBeVisible();
}

export async function tabTo(page, target) {
  for (let i = 0; i < 100; i++) {
    if (await target.evaluate(el => el === document.activeElement)) return;
    await page.keyboard.press("Tab");
  }
  await expect(target, "Control must be reachable with Tab").toBeFocused();
}

export async function fitsViewport(page, locator) {
  await expect(locator).toBeVisible();
  const box = await locator.boundingBox();
  expect(box.x).toBeGreaterThanOrEqual(-1);
  expect(box.x + box.width).toBeLessThanOrEqual(page.viewportSize().width + 1);
}

export async function noHorizontalOverflow(page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth
    <= document.documentElement.clientWidth + 1), "Document must not scroll horizontally").toBe(true);
}
