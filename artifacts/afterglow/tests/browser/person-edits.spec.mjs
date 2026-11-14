import { test, expect, openFollowUps, openPerson, savePerson } from "./fixtures.mjs";

const edits = {
  draft: "Hi Maya — here is the fictional workshop resource.",
  notes: "Synthetic note: discussed community onboarding.\nNext topic: prototypes.",
  commitment: "Share the fictional workshop resource",
  "next-action": "Send a resource link",
  "due-date": "2026-11-05",
};
async function expectEdits(page, values) {
  for (const [field, value] of Object.entries(values)) {
    await expect(page.getByTestId(`input-${field}`)).toHaveValue(value);
  }
}

test("draft, notes, promise, next step and due date survive save, reopen, reload and clearing", async ({ page, workspace }) => {
  await openFollowUps(page);
  await openPerson(page);
  for (const [field, value] of Object.entries(edits)) await page.getByTestId(`input-${field}`).fill(value);
  await savePerson(page);
  await page.getByTestId("button-close-person").click();
  const row = page.getByTestId("row-followup-demo-u0");
  await expect(row).toContainText(edits.commitment);
  await expect(row).toContainText(edits["next-action"]);
  await expect(row).toContainText("Draft saved");
  await openPerson(page);
  await expectEdits(page, edits);
  await page.getByTestId("button-close-person").click();
  await page.reload();
  await openPerson(page);
  await expectEdits(page, edits);
  const person = (await workspace.request("/workspace")).people.find(p => p.id === "demo-u0");
  expect(person).toMatchObject({
    draft: edits.draft, notes: edits.notes, commitment: edits.commitment,
    nextAction: edits["next-action"], dueDate: edits["due-date"], status: "suggested", met: false,
  });
  const cleared = Object.fromEntries(Object.keys(edits).map(key => [key, ""]));
  for (const field of Object.keys(edits)) await page.getByTestId(`input-${field}`).fill("");
  await savePerson(page);
  await page.getByTestId("button-close-person").click();
  await page.reload();
  await openPerson(page);
  await expectEdits(page, cleared);
});

test("copying an unsaved message writes the clipboard without saving or changing status", async ({ page, workspace }) => {
  await openFollowUps(page);
  const before = await workspace.request("/workspace");
  await openPerson(page);
  await page.getByTestId("input-draft").fill(edits.draft);
  const writes = [];
  page.on("request", req => {
    if (req.method() !== "GET" && new URL(req.url()).pathname.startsWith("/api/")) writes.push(req.method());
  });
  await page.getByTestId("button-copy-draft").click();
  await expect(page.getByTestId("button-copy-draft")).toHaveText("Copied");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(edits.draft);
  await expect(page.getByTestId("button-status-suggested")).toHaveAttribute("aria-selected", "true");
  expect(await workspace.request("/workspace")).toEqual(before);
  expect(writes, "Copy must not trigger a mutation").toEqual([]);
  await page.getByTestId("button-close-person").click();
  await page.reload();
  await openPerson(page);
  await expect(page.getByTestId("input-draft")).toHaveValue("");
  await expect(page.getByTestId("button-status-suggested")).toHaveAttribute("aria-selected", "true");
});

test("changing the meeting flag clears a saved draft without dropping the other context", async ({ page }) => {
  await openFollowUps(page);
  await openPerson(page);
  await page.getByTestId("input-draft").fill(edits.draft);
  await page.getByTestId("input-notes").fill(edits.notes);
  await savePerson(page);
  await page.getByTestId("switch-met").click();
  await savePerson(page);
  await expect(page.getByTestId("input-draft")).toHaveValue("");
  await page.getByTestId("button-close-person").click();
  await page.reload();
  await openPerson(page);
  await expect(page.getByTestId("switch-met")).toHaveAttribute("aria-checked", "true");
  await expect(page.getByTestId("input-draft")).toHaveValue("");
  await expect(page.getByTestId("input-notes")).toHaveValue(edits.notes);
});
