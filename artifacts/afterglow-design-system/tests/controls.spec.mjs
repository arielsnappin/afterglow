import { test, expect, openStory, skipToContent, tabTo, expectFocusLoop } from './fixtures.mjs';

test('keyboard search, navigation, deep links, history, and empty results', async ({ page }) => {
  await page.goto('./');
  const skip = page.getByRole('link', { name: 'Skip to content' });
  await page.keyboard.press('Tab');
  await expect(skip).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('main')).toBeFocused();

  const search = page.getByRole('textbox', { name: 'Search design system' });
  await tabTo(page, search, { backwards: true });
  await page.keyboard.type('Select');
  const nav = page.getByRole('navigation', { name: 'Design system navigation' });
  const select = nav.getByRole('button', { name: 'Select', exact: true });
  await tabTo(page, select);
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#page=select$/);
  await expect(select).toHaveAttribute('aria-current', 'true');
  await expect(page.getByRole('combobox', { name: 'Choose a fruit or vegetable' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: 'Select', exact: true })).toBeVisible();

  await tabTo(page, search);
  await page.keyboard.type('Dialog');
  const dialog = nav.getByRole('button', { name: 'Dialog', exact: true });
  await tabTo(page, dialog);
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#page=dialog$/);
  await page.goBack();
  await expect(page.getByRole('heading', { level: 1, name: 'Select', exact: true })).toBeVisible();
  await page.goForward();
  await expect(page.getByRole('heading', { level: 1, name: 'Dialog', exact: true })).toBeVisible();
  await tabTo(page, search);
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.type('fictional-no-matching-section');
  await expect(nav).toContainText('No sections match');
  await expect(nav.getByRole('button')).toHaveCount(0);
  await page.goto('./#page=not-a-real-story');
  await expect(page.getByRole('heading', { level: 1, name: 'Afterglow Design System' })).toBeVisible();
});

test('dialog traps keyboard focus and restores it after Escape and close action', async ({ page }) => {
  await openStory(page, 'dialog', 'Dialog');
  await skipToContent(page);
  const trigger = page.getByRole('button', { name: 'Edit profile', exact: true });
  const overlay = page.getByRole('dialog', { name: 'Edit profile' });
  for (const dismiss of ['Escape', 'Cancel']) {
    await tabTo(page, trigger);
    await page.keyboard.press('Enter');
    await expect(overlay).toBeVisible();
    await expect(overlay).toHaveAttribute('aria-describedby', /.+/);
    await expectFocusLoop(page, overlay);
    if (dismiss === 'Escape') await page.keyboard.press('Escape');
    else {
      await tabTo(page, overlay.getByRole('button', { name: dismiss, exact: true }));
      await page.keyboard.press('Enter');
    }
    await expect(overlay).toHaveCount(0);
    await expect(trigger).toBeFocused();
  }
});

for (const side of ['right', 'left', 'top', 'bottom']) {
  test(`${side} sheet traps and restores keyboard focus`, async ({ page }) => {
    await openStory(page, 'sheet', 'Sheet');
    await skipToContent(page);
    const trigger = page.getByRole('button', { name: `Open ${side} sheet` });
    const overlay = page.getByRole('dialog', { name: 'A little context' });
    for (const dismiss of ['Escape', 'Close preview']) {
      await tabTo(page, trigger);
      await page.keyboard.press('Enter');
      await expect(overlay).toBeVisible();
      await expectFocusLoop(page, overlay);
      if (dismiss === 'Escape') await page.keyboard.press('Escape');
      else {
        await tabTo(page, overlay.getByRole('button', { name: dismiss, exact: true }));
        await page.keyboard.press('Enter');
      }
      await expect(overlay).toHaveCount(0);
      await expect(trigger).toBeFocused();
    }
  });
}

test('select supports arrows, commit, disabled options, Escape, and return focus', async ({ page }) => {
  await openStory(page, 'select', 'Select');
  await skipToContent(page);
  // Radix makes the background (including the trigger) aria-hidden while its
  // modal listbox is open. Keep the trigger addressable for expanded assertions.
  const select = page.getByRole('combobox', { name: 'Choose a fruit or vegetable', includeHidden: true });
  await tabTo(page, select);
  await page.keyboard.press('Space');
  await expect(select).toHaveAttribute('aria-expanded', 'true');
  const apple = page.getByRole('option', { name: 'Apple', exact: true });
  const banana = page.getByRole('option', { name: 'Banana', exact: true });
  // Radix schedules listbox focus and arrow-key focus on timers. Waiting for
  // each actual focus change prevents the next key racing those timers.
  await expect(apple).toBeFocused();
  await page.keyboard.press('Home');
  await expect(apple).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(banana).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(select).toHaveText('Banana');
  await expect(select).toBeFocused();
  await page.keyboard.press('Space');
  await expect(banana).toBeFocused();
  await expect(banana).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('option', { name: 'Spinach (out of stock)' })).toHaveAttribute('aria-disabled', 'true');
  await page.keyboard.press('End');
  await expect(page.getByRole('option', { name: 'Carrot', exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(select).toHaveText('Banana');
  await expect(select).toBeFocused();
  await expect(page.getByRole('combobox', { name: 'Disabled select example' })).toBeDisabled();
  await page.keyboard.press('Tab');
  await expect(select).not.toBeFocused();
  expect(await page.evaluate(() => document.activeElement?.getAttribute('aria-label'))).not.toBe('Disabled select example');
});

test('toggles and switches expose keyboard state changes and skip disabled controls', async ({ page }) => {
  await openStory(page, 'toggle', 'Toggle');
  await skipToContent(page);
  const bold = page.getByRole('button', { name: 'Toggle bold', exact: true });
  await tabTo(page, bold);
  await expect(bold).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Space');
  await expect(bold).toHaveAttribute('aria-pressed', 'false');
  await page.keyboard.press('Enter');
  await expect(bold).toHaveAttribute('aria-pressed', 'true');
  const italic = page.getByRole('button', { name: 'Toggle italic', exact: true });
  await page.keyboard.press('Tab');
  await expect(italic).toBeFocused();
  await page.keyboard.press('Space');
  await expect(italic).toHaveAttribute('aria-pressed', 'true');
  await tabTo(page, page.getByRole('button', { name: 'Large underline' }));
  await expect(page.getByRole('button', { name: 'Disabled bold' })).toBeDisabled();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Disabled bold' })).not.toBeFocused();

  await openStory(page, 'switch', 'Switch');
  await skipToContent(page);
  const notifications = page.getByRole('switch', { name: 'Notifications' });
  const sync = page.getByRole('switch', { name: 'Background sync' });
  await tabTo(page, notifications);
  await expect(notifications).toBeChecked();
  await page.keyboard.press('Space');
  await expect(notifications).not.toBeChecked();
  await page.keyboard.press('Tab');
  await expect(sync).toBeFocused();
  await expect(sync).not.toBeChecked();
  await page.keyboard.press('Space');
  await expect(sync).toBeChecked();
  await expect(page.getByRole('switch', { name: 'Unavailable' })).toBeDisabled();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('switch', { name: 'Unavailable' })).not.toBeFocused();
});

test('source RSVP picker uses roving focus, wraps selection, and disables the whole group', async ({ page }) => {
  await openStory(page, 'source-rsvp-picker', 'RSVP picker');
  await skipToContent(page);
  const group = page.getByRole('radiogroup', { name: 'RSVP', exact: true }).first();
  const going = group.getByRole('radio', { name: 'Going', exact: true });
  const maybe = group.getByRole('radio', { name: 'Maybe', exact: true });
  const cant = group.getByRole('radio', { name: "Can't go", exact: true });
  await tabTo(page, going);
  for (const [key, selected] of [['ArrowRight', maybe], ['ArrowDown', cant], ['ArrowRight', going], ['ArrowLeft', cant], ['ArrowUp', maybe]]) {
    await page.keyboard.press(key);
    await expect(selected).toBeFocused();
    await expect(selected).toBeChecked();
    await expect(group.getByRole('radio', { checked: true })).toHaveCount(1);
    await expect(selected).toHaveAttribute('tabindex', '0');
  }
  const disabled = page.getByRole('radiogroup', { name: 'RSVP', exact: true }).last();
  await expect(disabled).toHaveAttribute('aria-disabled', 'true');
  for (const radio of await disabled.getByRole('radio').all()) await expect(radio).toBeDisabled();
  await page.keyboard.press('Tab');
  expect(await disabled.evaluate((node) => node.contains(document.activeElement))).toBe(false);
});
