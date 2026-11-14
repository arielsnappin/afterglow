import { test as base, expect } from '@playwright/test';

// Each test gets a fresh browser context/storage. Only the fictional guide may
// load: any API/data request is blocked BEFORE it can touch real user data.
export const test = base.extend({
  page: async ({ page, baseURL }, use) => {
    const forbidden = [];
    const errors = [];
    const target = new URL(baseURL);
    page.on('pageerror', (error) => errors.push(error.message));
    await page.route('**/*', async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      // Fonts are deliberately offline so assertions don't depend on a CDN.
      if (['fonts.googleapis.com', 'fonts.gstatic.com'].includes(url.hostname)) {
        return route.abort();
      }
      if (url.origin !== target.origin
        || !url.pathname.startsWith(target.pathname)
        || /\/api(?:\/|$)/i.test(url.pathname)
        || !['GET', 'HEAD'].includes(request.method())) {
        forbidden.push(`${request.method()} ${url.origin}${url.pathname}`);
        return route.abort();
      }
      return route.continue();
    });
    await use(page);
    expect(forbidden, 'Guide must not request live data or leave its artifact').toEqual([]);
    expect(errors, 'Guide must not throw browser errors').toEqual([]);
  },
});

export { expect };

export async function openStory(page, id, title) {
  await page.goto(`./#page=${id}`);
  await expect(page.getByRole('heading', { level: 1, name: title, exact: true })).toBeVisible();
  await expect(page.getByRole('status', { name: 'Loading preview' })).toHaveCount(0);
}

// Reach controls with real Tab presses rather than focus(), click(), or DOM
// event dispatch. The bound makes broken tab order fail with a useful message.
export async function tabTo(page, target, { backwards = false, limit = 100 } = {}) {
  await expect(target).toBeVisible();
  for (let i = 0; i < limit; i++) {
    if (await target.evaluate((node) => node === document.activeElement)) return;
    await page.keyboard.press(backwards ? 'Shift+Tab' : 'Tab');
  }
  await expect(target, `Not reachable in ${limit} keyboard steps`).toBeFocused();
}

export async function skipToContent(page) {
  const skip = page.getByRole('link', { name: 'Skip to content' });
  await tabTo(page, skip);
  await page.keyboard.press('Enter');
  await expect(page.getByRole('main')).toBeFocused();
}

export async function expectFocusLoop(page, overlay) {
  const buttons = overlay.getByRole('button');
  const first = buttons.first();
  const last = buttons.last();
  await expect(first).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(last).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(first).toBeFocused();
  for (let i = 0; i < await buttons.count(); i++) {
    await page.keyboard.press('Tab');
    expect(await overlay.evaluate((node) => node.contains(document.activeElement)),
      'Tab must never escape the modal').toBe(true);
  }
}
