import { test, expect, openStory, skipToContent, tabTo } from './fixtures.mjs';

test('fresh guide defaults to Night out independently of system and product themes', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.addInitScript(() => {
    localStorage.setItem('afterglow-app-theme', 'light');
    localStorage.setItem('theme', 'light');
  });
  await page.goto('./');
  await expect(page.locator('html')).toHaveClass('dark');
  await expect(page.getByRole('button', { name: 'Switch to light theme' })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('afterglow-design-system-theme'))).toBeNull();
});

test('guide persists both themes without overwriting the product or generic theme keys', async ({ page }) => {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('theme-test-seeded')) {
      localStorage.setItem('afterglow-app-theme', 'dark');
      localStorage.setItem('theme', 'dark');
      localStorage.setItem('afterglow-design-system-theme', 'light');
      sessionStorage.setItem('theme-test-seeded', 'true');
    }
  });
  await page.goto('./');
  await expect(page.locator('html')).toHaveClass('light');
  for (const theme of ['dark', 'light']) {
    const toggle = page.getByRole('button', { name: `Switch to ${theme} theme` });
    await tabTo(page, toggle);
    await page.keyboard.press('Enter');
    await expect(page.locator('html')).toHaveClass(theme);
    await expect.poll(() => page.evaluate(() => ({
      guide: localStorage.getItem('afterglow-design-system-theme'),
      app: localStorage.getItem('afterglow-app-theme'),
      generic: localStorage.getItem('theme'),
    }))).toEqual({ guide: theme, app: 'dark', generic: 'dark' });
    await page.reload();
    await expect(page.locator('html')).toHaveClass(theme);
  }
});

test('theme query sets a fresh default but does not override saved preferences', async ({ page }) => {
  await page.goto('./?theme=light');
  await expect(page.locator('html')).toHaveClass('light');
  await tabTo(page, page.getByRole('button', { name: 'Switch to dark theme' }));
  await page.keyboard.press('Enter');
  await expect(page.locator('html')).toHaveClass('dark');
  await page.reload();
  await expect(page.locator('html')).toHaveClass('dark');
});

async function motionStyles(locator) {
  return locator.evaluate((node) => {
    const style = getComputedStyle(node);
    const seconds = (value) => value.split(',').map((part) =>
      parseFloat(part) * (part.trim().endsWith('ms') ? 0.001 : 1));
    return {
      animation: Math.max(...seconds(style.animationDuration)),
      transition: Math.max(...seconds(style.transitionDuration)),
      iterations: style.animationIterationCount,
      transform: style.transform,
    };
  });
}

test('reduced-motion emulation suppresses spinner, source bounce, and overlay motion', async ({ page }) => {
  await openStory(page, 'spinner', 'Spinner');
  const spinner = page.getByRole('status', { name: 'Loading', exact: true }).first();
  await expect(spinner).toBeVisible();
  expect((await motionStyles(spinner)).animation).toBeGreaterThan(0.1);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
  expect((await motionStyles(spinner)).animation).toBeLessThanOrEqual(0.00001);
  expect((await motionStyles(spinner)).iterations).toBe('1');

  await openStory(page, 'source-button', 'Button');
  const sourceButton = page.getByRole('button', { name: 'Share invite', exact: true });
  await sourceButton.hover();
  expect((await motionStyles(sourceButton)).transform).toBe('none');
  expect((await motionStyles(sourceButton)).transition).toBeLessThanOrEqual(0.00001);
  await openStory(page, 'source-rsvp-picker', 'RSVP picker');
  const selected = page.getByRole('radiogroup').first().getByRole('radio', { checked: true });
  expect((await motionStyles(selected)).transform).toBe('none');
  expect((await motionStyles(selected.locator('.ag-rsvp__emoji'))).animation).toBeLessThanOrEqual(0.00001);

  for (const [id, title, triggerName, dialogName] of [
    ['dialog', 'Dialog', 'Edit profile', 'Edit profile'],
    ['sheet', 'Sheet', 'Open right sheet', 'A little context'],
  ]) {
    await openStory(page, id, title);
    await skipToContent(page);
    const trigger = page.getByRole('button', { name: triggerName, exact: true });
    await tabTo(page, trigger);
    await page.keyboard.press('Enter');
    const overlay = page.getByRole('dialog', { name: dialogName });
    await expect(overlay).toBeVisible();
    const styles = await motionStyles(overlay);
    expect(styles.animation).toBeLessThanOrEqual(0.00001);
    expect(styles.transition).toBeLessThanOrEqual(0.00001);
    await page.keyboard.press('Escape');
    await expect(overlay).toHaveCount(0);
    await expect(trigger).toBeFocused();
  }
});

for (const theme of ['dark', 'light']) {
  test(`mobile browser navigation is keyboard accessible in ${theme}`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto(`./?theme=${theme}`);
    const search = page.getByRole('textbox', { name: 'Search design system' });
    await tabTo(page, search);
    await page.keyboard.type('Select');
    const summary = page.locator('summary');
    await page.keyboard.press('Tab');
    await expect(summary).toBeFocused();
    await page.keyboard.press('Enter');
    const nav = page.getByRole('navigation', { name: 'Design system navigation' });
    await expect(nav).toHaveCount(1);
    await tabTo(page, nav.getByRole('button', { name: 'Select', exact: true }));
    await page.keyboard.press('Enter');
    await expect(page.getByRole('heading', { level: 1, name: 'Select', exact: true })).toBeVisible();
    await expect(summary).toBeFocused();
    await expect(page.locator('details')).not.toHaveAttribute('open');
    const select = page.getByRole('combobox', { name: 'Choose a fruit or vegetable' });
    await expect(select).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
    await tabTo(page, select);
    await page.keyboard.press('Space');
    await expectContained(page, page.getByRole('listbox'));
    await page.keyboard.press('Escape');
    await expect(select).toBeFocused();
  });
}

async function expectContained(page, overlay) {
  // Poll through enter animations before measuring the final layout.
  await expect.poll(async () => overlay.evaluate((node) => {
    const rect = node.getBoundingClientRect();
    return rect.left >= -1 && rect.top >= -1
      && rect.right <= innerWidth + 1 && rect.bottom <= innerHeight + 1
      && node.scrollWidth <= node.clientWidth + 1;
  }), { message: 'Overlay must fit the viewport without horizontal clipping' }).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(page.viewportSize().width);
}

for (const theme of ['dark', 'light']) {
  test(`narrow dialog and all sheet edges fit and keep actions reachable in ${theme}`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto(`./?theme=${theme}#page=dialog`);
    await skipToContent(page);
    const trigger = page.getByRole('button', { name: 'Edit profile', exact: true });
    await tabTo(page, trigger);
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog', { name: 'Edit profile' });
    await expectContained(page, dialog);
    await tabTo(page, dialog.getByRole('button', { name: 'Save changes' }));
    await expect(dialog.getByRole('button', { name: 'Save changes' })).toBeInViewport();
    await page.keyboard.press('Enter');
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
    for (const side of ['right', 'left', 'top', 'bottom']) {
      await openStory(page, 'sheet', 'Sheet');
      await skipToContent(page);
      const opener = page.getByRole('button', { name: `Open ${side} sheet` });
      await tabTo(page, opener);
      await page.keyboard.press('Enter');
      const sheet = page.getByRole('dialog', { name: 'A little context' });
      await expectContained(page, sheet);
      const close = sheet.getByRole('button', { name: 'Close preview' });
      await tabTo(page, close);
      await expect(close).toBeInViewport();
      await page.keyboard.press('Enter');
      await expect(sheet).toHaveCount(0);
      await expect(opener).toBeFocused();
    }
  });

  test(`content-heavy local form scrolls inside a short viewport in ${theme}`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 480 });
    await page.goto(`./?theme=${theme}#page=example-person-forms`);
    const trigger = page.getByRole('button', { name: 'Add someone you met' });
    await expect(trigger).toBeVisible();
    await skipToContent(page);
    await tabTo(page, trigger);
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog', { name: 'Who did you meet?' });
    await expectContained(page, dialog);
    expect(await dialog.evaluate((node) => node.scrollHeight > node.clientHeight)).toBe(true);
    await tabTo(page, dialog.getByRole('button', { name: 'Save person', exact: true }));
    await expect(dialog.getByRole('button', { name: 'Save person', exact: true })).toBeInViewport();
    expect(await dialog.evaluate((node) => node.scrollTop)).toBeGreaterThan(0);
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });
}
