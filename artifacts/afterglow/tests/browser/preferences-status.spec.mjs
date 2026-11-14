import { test, expect, openFollowUps, tabTo } from "./fixtures.mjs";

test("saving preferences propagates the new order to Home and Follow-ups and survives reload", async ({ page, workspace }) => {
  await page.goto("/settings");
  const before = await workspace.request("/workspace");
  await expect(page.getByTestId("panel-before-after").locator("ol li .font-semibold").first()).toHaveText("Ada Moss");
  // Community gives everyone equal weight; Design promotes community designers.
  await page.getByTestId("input-goal").fill("Design");
  await page.getByTestId("button-remove-interest-Community").click();
  await page.getByTestId("input-interest").fill("Design");
  await page.getByTestId("input-interest").press("Enter");
  await expect(page.getByTestId("panel-before-after")).toContainText("After saving");
  expect((await workspace.request("/workspace")).preferences).toEqual(before.preferences);
  await page.getByTestId("button-save-preferences").click();
  await expect(page.getByTestId("button-save-preferences")).toBeDisabled();
  expect((await workspace.request("/workspace")).preferences).toEqual({ goal: "Design", interests: ["Design"] });
  const names = await page.getByTestId("panel-before-after").locator("ol li .font-semibold").allTextContents();
  expect(names[0]).toBe("Alex Morgan");
  await page.getByTestId("link-nav-home").click();
  await expect(page.getByRole("main")).toContainText('looking for: "Design"');
  await expect(page.locator('[data-testid^="button-priority-"]').first()).toHaveAttribute("data-testid", "button-priority-demo-u3");
  await page.getByTestId("link-nav-follow-ups").click();
  await expect(page.locator('[data-testid^="row-followup-"]').first()).toHaveAttribute("data-testid", "row-followup-demo-u3");
  await page.reload();
  await expect(page.locator('[data-testid^="row-followup-"]').first()).toHaveAttribute("data-testid", "row-followup-demo-u3");
  await page.getByTestId("link-nav-profile").click();
  await expect(page.getByTestId("input-goal")).toHaveValue("Design");
  await expect(page.getByRole("list", { name: "Interests" })).toHaveText("Design");
  await expect(page.getByTestId("button-save-preferences")).toBeDisabled();
});

test("status combobox is keyboard reachable, visibly focused and preserves grouping after reload", async ({ page, workspace }) => {
  await openFollowUps(page);
  const select = page.getByTestId("select-status-demo-u0");
  const unfocusedShadow = await select.evaluate(el => getComputedStyle(el).boxShadow);
  // Reach the entire action pair using real Tab presses.
  await tabTo(page, page.getByTestId("button-reach-out-demo-u0"));
  await page.keyboard.press("Tab");
  await expect(select).toBeFocused();
  const shadow = await select.evaluate(el => getComputedStyle(el).boxShadow);
  expect(shadow, "Focused status needs its own visible focus ring").not.toBe("none");
  expect(shadow, "Focus must change the status control's own ring").not.toBe(unfocusedShadow);
  expect(await select.evaluate(el => el.matches(":focus-visible"))).toBe(true);
  await page.keyboard.press("Space");
  const option = name => page.getByRole("option", { name, exact: true });
  await expect(option("Suggested")).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(option("Saved")).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(select).toHaveText("Saved");
  await expect(select).toBeFocused();
  await expect.poll(async () => (await workspace.request("/workspace")).people.find(p => p.id === "demo-u0").status).toBe("saved");
  // Saved remains in warm outreach. Contacted must move to Waiting.
  await page.keyboard.press("Space");
  await expect(option("Saved")).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(option("Contacted")).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("row-followup-demo-u0")).toHaveCount(0);
  await page.getByTestId("button-filter-waiting").click();
  await expect(select).toHaveText("Contacted");
  await page.reload();
  await page.getByTestId("button-filter-waiting").click();
  await expect(select).toHaveText("Contacted");
  await select.click();
  await option("Replied").click();
  await expect(page.getByTestId("row-followup-demo-u0")).toHaveCount(0);
  await page.getByTestId("button-filter-reach").click();
  await expect(page.getByTestId("row-followup-demo-u0")).toHaveCount(0);
  // A registered-only profile is never warm outreach.
  await expect(page.getByTestId("row-followup-demo-u8")).toHaveCount(0);
  await page.getByTestId("button-filter-all").click();
  await expect(select).toHaveText("Replied");
  await page.reload();
  await page.getByTestId("button-filter-all").click();
  await expect(select).toHaveText("Replied");
  expect((await workspace.request("/workspace")).people.find(p => p.id === "demo-u0").status).toBe("replied");
});
