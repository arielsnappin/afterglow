import { after, test } from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { db, demoWorkspaces, pool } from "@workspace/db";
import { inArray } from "drizzle-orm";
import { changeDemo, readDemo } from "./demo-store";
import { applyChapter, createImportedWorkspace, summaryOf } from "./luma-scenario";
import { GetWorkspaceResponse, GetSummaryResponse, PreviewSyntheticImportResponse, CommitSyntheticImportResponse } from "@workspace/api-zod";

const ids: string[] = [];
const newId = () => { const id = randomBytes(32).toString("hex"); ids.push(id); return id; };
after(async () => {
  if (ids.length) await db.delete(demoWorkspaces).where(inArray(demoWorkspaces.id, ids));
  await pool.end();
});
test("browser workspaces stay isolated; validated writes roll back on thrown or invalid mutations", async () => {
  const a = newId(), b = newId();
  const original = await readDemo(a);
  await assert.rejects(changeDemo(a, state => { state.people[0]!.notes = "Must roll back"; throw new Error("forced failure"); }), /forced failure/);
  assert.deepEqual(await readDemo(a), original);
  await assert.rejects(changeDemo(a, state => { state.events[0]!.kind = "invalid" as "past"; }));
  assert.deepEqual(await readDemo(a), original);
  await changeDemo(a, state => Object.assign(state, createImportedWorkspace()));
  assert.equal((await readDemo(a)).journey!.chapter, 0);
  assert.equal((await readDemo(b)).journey, undefined);
});
test("simultaneous imports are repeat-safe, chapter retry advances once, reload keeps edits and reset restores snapshot", async () => {
  const id = newId();
  await changeDemo(id, state => { state.people[0]!.notes = "Original pre-import edit"; });
  const original = await readDemo(id);
  const imports = await Promise.all(Array.from({ length: 3 }, () => changeDemo(id, state => {
    if (state.journey) return false;
    Object.assign(state, createImportedWorkspace()); return true;
  })));
  assert.equal(imports.filter(Boolean).length, 1);
  await changeDemo(id, state => { state.people[0]!.notes = "Demo manual edit"; });
  await Promise.all(Array.from({ length: 3 }, () => changeDemo(id, state => {
    if (state.journey!.chapter === 0) applyChapter(state, 1);
  })));
  const reloaded = await readDemo(id);
  assert.equal(reloaded.journey!.chapter, 1);
  assert.equal(reloaded.people[0]!.notes, "Demo manual edit");
  await changeDemo(id, (state, beforeImport) => {
    assert.ok(beforeImport);
    for (const key of Object.keys(state)) delete (state as unknown as Record<string, unknown>)[key];
    Object.assign(state, beforeImport);
  });
  assert.deepEqual(await readDemo(id), original);
});

test("HTTP contract supports both entry paths, failure/retry, cookie scope, due counts, bounded bodies and reset confirmation", async () => {
  const id = newId(), other = newId();
  const request = async (path: string, data?: unknown, scope = id) => {
    const response = await fetch(`http://localhost:80/api${path}`, {
      method: data === undefined ? "GET" : "POST",
      headers: { Cookie: `afterglow_demo=${scope}`, ...(data === undefined ? {} : { "Content-Type": "application/json" }) },
      body: data === undefined ? undefined : JSON.stringify(data),
    });
    return { status: response.status, data: await response.json() };
  };
  const original = (await request("/workspace")).data;
  const sampleResponse = await fetch("http://localhost:80/api/demo/sample");
  assert.equal(sampleResponse.status, 200);
  assert.match(sampleResponse.headers.get("content-disposition")!, /synthetic/);
  const csv = await sampleResponse.text();
  const bad = await request("/demo/commit", { source: "csv", csv: csv.replace("Maya Rowan", "Unsupported") });
  assert.equal(bad.status, 400);
  assert.ok(bad.data && typeof bad.data === "object" && "error" in bad.data);
  assert.match(String(bad.data.error), /Unsupported/);
  assert.deepEqual((await request("/workspace")).data, original);
  const providerPreview = await request("/demo/preview", { source: "provider" });
  const csvPreview = await request("/demo/preview", { source: "csv", csv });
  assert.deepEqual(providerPreview.data, csvPreview.data);
  assert.equal(PreviewSyntheticImportResponse.parse(csvPreview.data).committed, false);
  assert.deepEqual((await request("/workspace")).data, original);
  const large = await request("/demo/preview", { source: "csv", csv: "x".repeat(70000) });
  assert.equal(large.status, 413);
  assert.equal(CommitSyntheticImportResponse.parse((await request("/demo/commit", { source: "csv", csv })).data).committed, true);
  assert.equal(CommitSyntheticImportResponse.parse((await request("/demo/commit", { source: "provider" })).data).duplicate, true);
  assert.equal(GetWorkspaceResponse.parse((await request("/workspace", undefined, other)).data).journey, undefined);
  const earlyDraft = await request("/people/demo-u0/draft", { mode: "followup" });
  assert.equal(earlyDraft.status, 400);
  const initialResponse = (await request("/workspace")).data;
  const initial = GetWorkspaceResponse.parse(initialResponse);
  assert.equal(initial.journey!.chapter, 0);
  assert.ok(initialResponse && typeof initialResponse === "object" && !("_beforeImport" in initialResponse));
  await Promise.all([request("/demo/advance", { chapter: 0 }), request("/demo/advance", { chapter: 0 })]);
  assert.equal(GetWorkspaceResponse.parse((await request("/workspace")).data).journey!.chapter, 1);
  await changeDemo(id, state => { state.people[0]!.dueDate = "2026-11-05"; state.people[0]!.notes = "Preserved API edit"; });
  assert.equal(GetSummaryResponse.parse((await request("/summary")).data).dueCount, 0);
  await request("/demo/advance", { chapter: 1 });
  assert.equal(GetSummaryResponse.parse((await request("/summary")).data).dueCount, 1);
  for (let chapter = 2; chapter <= 7; chapter++) {
    const advanced = await request("/demo/advance", { chapter });
    assert.equal(advanced.status, 200);
    const state = GetWorkspaceResponse.parse(advanced.data);
    assert.equal(state.people[0]!.notes, "Preserved API edit");
    assert.deepEqual((await request("/summary")).data, summaryOf(state));
  }
  assert.equal(GetWorkspaceResponse.parse((await request("/workspace")).data).journey!.chapter, 7);
  assert.equal((await request("/demo/reset", { confirm: false })).status, 400);
  assert.equal(GetWorkspaceResponse.parse((await request("/workspace")).data).journey!.chapter, 7);
  assert.equal((await request("/demo/reset", { confirm: true })).status, 200);
  assert.deepEqual((await request("/workspace")).data, original);
  assert.equal((await request("/demo/advance", { chapter: 0 })).status, 409);
});
