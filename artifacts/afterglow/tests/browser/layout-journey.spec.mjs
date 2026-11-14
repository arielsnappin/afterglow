import { test, expect, openFollowUps, openPerson, savePerson, fitsViewport, noHorizontalOverflow } from "./fixtures.mjs";

test("narrow Profile interest editor and explainer stay inside their panels", async ({ page }) => {
  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 850 });
    await page.goto("/settings");
    await fitsViewport(page, page.getByTestId("input-interest"));
    await fitsViewport(page, page.getByTestId("button-add-interest"));
    await fitsViewport(page, page.getByTestId("panel-preferences-explainer"));
    await page.getByTestId("input-interest").fill("Fictional workshop");
    await page.getByTestId("button-add-interest").click();
    await expect(page.getByRole("list", { name: "Interests" })).toContainText("Fictional workshop");
    await noHorizontalOverflow(page);
    await page.getByTestId("button-save-preferences").scrollIntoViewIfNeeded();
    await fitsViewport(page, page.getByTestId("button-save-preferences"));
  }
});

test("narrow event debrief and attendees fit without hiding editable controls", async ({ page }) => {
  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 850 });
    await page.goto("/events/luma-demo-e1");
    await fitsViewport(page, page.getByTestId("input-debrief"));
    await fitsViewport(page, page.getByTestId("button-load-scenario-debrief"));
    await fitsViewport(page, page.getByTestId("button-attendee-demo-u0"));
    await page.getByTestId("input-debrief").fill("Synthetic notes about the fictional workshop.");
    await page.getByTestId("button-save-debrief").scrollIntoViewIfNeeded();
    await fitsViewport(page, page.getByTestId("button-save-debrief"));
    await noHorizontalOverflow(page);
  }
});

test("chapter advances preserve edits and due labels; reset cancel preserves and confirm restores the exact snapshot", async ({ page, workspace }) => {
  await openFollowUps(page);
  await openPerson(page);
  const values = {
    draft: "Synthetic saved message", notes: "Synthetic saved note",
    commitment: "Share a fictional deck", "next-action": "Share deck", "due-date": "2026-11-05",
  };
  for (const [field, value] of Object.entries(values)) await page.getByTestId(`input-${field}`).fill(value);
  await page.getByTestId("button-status-saved").click();
  await savePerson(page);
  await page.getByTestId("button-close-person").click();
  const row = page.getByTestId("row-followup-demo-u0");
  await expect(row).toContainText("In 1d");
  await page.goto("/imports");
  await page.getByTestId("button-advance-chapter").click();
  await expect(page.getByTestId("text-chapter-title")).toHaveText("Review your follow-ups");
  await expect(page.getByTestId("text-simulated-date")).toContainText("5 Nov 2026");
  await page.getByTestId("link-nav-follow-ups").click();
  await expect(row).toContainText("Due today");
  await page.getByTestId("link-nav-home").click();
  await expect(page.getByTestId("stat-due-now")).toContainText("1 follow-up due");
  await page.getByTestId("link-nav-integrations").click();
  await page.getByTestId("button-advance-chapter").click();
  await expect(page.getByTestId("text-chapter-title")).toHaveText("Familiar faces across rooms");
  await page.getByTestId("link-nav-follow-ups").click();
  await expect(row).toContainText("overdue");
  await openPerson(page);
  for (const [field, value] of Object.entries(values)) await expect(page.getByTestId(`input-${field}`)).toHaveValue(value);
  await expect(page.getByTestId("button-status-saved")).toHaveAttribute("aria-selected", "true");
  await page.getByTestId("button-close-person").click();
  await page.goto("/imports");
  for (let chapter = 3; chapter < 7; chapter++) {
    await page.getByTestId("button-advance-chapter").click();
    await expect(page.getByTestId("demo-controller")).toContainText(`chapter ${chapter + 1} of 7`);
  }
  await expect(page.getByTestId("button-advance-chapter")).toBeDisabled();
  await page.reload();
  await expect(page.getByTestId("text-chapter-title")).toHaveText("Four weeks of follow-through");
  await expect(page.getByTestId("button-advance-chapter")).toBeDisabled();
  await page.getByTestId("link-nav-follow-ups").click();
  await openPerson(page);
  for (const [field, value] of Object.entries(values)) await expect(page.getByTestId(`input-${field}`)).toHaveValue(value);
  await expect(page.getByTestId("button-status-saved")).toHaveAttribute("aria-selected", "true");
  await page.getByTestId("button-close-person").click();
  // Mutate preferences too: reset must restore the pre-import values, not these.
  await page.getByTestId("link-nav-profile").click();
  await page.getByTestId("input-goal").fill("Synthetic post-import preference");
  await page.getByTestId("button-save-preferences").click();
  await expect(page.getByTestId("button-save-preferences")).toBeDisabled();
  await page.getByTestId("link-nav-integrations").click();
  const beforeCancel = await workspace.request("/workspace");
  await page.getByTestId("button-reset-demo").click();
  await page.getByTestId("button-reset-cancel").click();
  await expect(page.getByRole("alertdialog")).toHaveCount(0);
  expect(await workspace.request("/workspace")).toEqual(beforeCancel);
  await page.getByTestId("button-reset-demo").click();
  await page.getByTestId("button-reset-confirm").click();
  await expect(page.getByRole("alertdialog")).toHaveCount(0);
  await expect(page.getByTestId("demo-controller")).toHaveCount(0);
  expect(await workspace.request("/workspace")).toEqual(workspace.original);
  await page.reload();
  expect(await workspace.request("/workspace")).toEqual(workspace.original);
  await page.getByTestId("link-nav-profile").click();
  await expect(page.getByTestId("input-goal")).toHaveValue(workspace.original.preferences.goal);
});
