import { test } from "node:test";
import assert from "node:assert/strict";
import { applyChapter, CHAPTERS, createImportedWorkspace, HEADERS, MAX_CSV_BYTES, normalizeImport, parseCsv, sampleCsv, scenarioRows, summaryOf } from "./luma-scenario";
import { createDraft, debriefCandidates } from "./demo-suggestions";
import { GetWorkspaceResponse } from "@workspace/api-zod";

test("provider and CSV use the same normalization; sample stays within JSON request limit", () => {
  assert.deepEqual(normalizeImport("provider"), normalizeImport("csv", sampleCsv()));
  assert.equal(normalizeImport("provider").guestCount, 60);
  assert.ok(Buffer.byteLength(sampleCsv()) < MAX_CSV_BYTES);
  assert.ok(Buffer.byteLength(JSON.stringify({ source: "csv", csv: sampleCsv() })) < 64 * 1024);
  assert.equal(new Set(scenarioRows().map(r => r[9])).size, 24);
  assert.equal(HEADERS.length, 18);
});
test("quoted fields support commas, escaped quotes, CRLF, BOM and embedded newlines", () => {
  assert.deepEqual(parseCsv('\uFEFF"a,b","a""b","line\r\nnext"\r\n'), [["a,b", 'a"b', "line\r\nnext"]]);
  assert.deepEqual(normalizeImport("csv", "\uFEFF" + sampleCsv()), normalizeImport("provider"));
});
test("row order is irrelevant; names are not identities", () => {
  const rows = parseCsv(sampleCsv());
  const reordered = [rows[0], ...rows.slice(1).reverse()].map(r => r!.map(c => `"${c.replaceAll('"', '""')}"`).join(",")).join("\n");
  assert.deepEqual(normalizeImport("csv", reordered), normalizeImport("provider"));
  const state = createImportedWorkspace();
  const same = state.people.filter(p => p.name === "Alex Morgan");
  assert.equal(same.length, 2);
  assert.notEqual(same[0]!.id, same[1]!.id);
});
test("malformed quoting, missing headers, rows and duplicate identities fail explicitly", () => {
  for (const input of ['"unfinished', 'a"b,c', '"a"x,b']) assert.throws(() => parseCsv(input), /quot/);
  assert.throws(() => normalizeImport("csv", "name,email\nSomebody,person@example.com"), /headers/);
  assert.throws(() => normalizeImport("csv", sampleCsv().split("\r\n").slice(0, 5).join("\r\n")), /60/);
  const rows = sampleCsv().split("\r\n"); rows[2] = rows[1]!;
  assert.throws(() => normalizeImport("csv", rows.join("\r\n")), /Duplicate/);
  assert.throws(() => normalizeImport("csv"), /Choose/);
});
test("size, impossible dates, invalid zones, personal emails and arbitrary changed content are rejected", () => {
  assert.throws(() => normalizeImport("csv", "x".repeat(MAX_CSV_BYTES + 1)), /large/);
  assert.throws(() => normalizeImport("csv", sampleCsv().replace("2026-11-03T18:00:00Z", "2026-02-30T18:00:00Z")), /timestamp/);
  assert.throws(() => normalizeImport("csv", sampleCsv().replace("Etc/UTC", "Invalid/Zone")), /timezone/);
  assert.throws(() => normalizeImport("csv", sampleCsv().replace("person0@example.com", "someone@private.test")), /emails/);
  assert.throws(() => normalizeImport("csv", sampleCsv().replace("Maya Rowan", "Another Name")), /Unsupported content/);
});
test("initial chapter has no attendance, notes, meetings, due dates or outreach results", () => {
  const state = GetWorkspaceResponse.parse(createImportedWorkspace());
  assert.equal(state.events.length, 6); assert.equal(state.people.length, 24);
  assert.ok(state.events.every(e => e.kind === "upcoming" && !e.selfCheckedInAt && !e.scenarioDebrief && !e.debrief));
  assert.ok(state.memberships!.every(m => !m.checkedInAt));
  assert.ok(state.people.every(p => !p.met && !p.notes && !p.draft && !p.dueDate && p.status === "suggested" && p.sharedEventIds!.length === 0));
  assert.deepEqual(summaryOf(state), { eventsAttended: 0, peopleMet: 0, openFollowups: 0, dueCount: 0, conversationsStarted: 0 });
});
test("chapter boundaries release only eligible evidence; approved alone is not attendance", () => {
  const state = createImportedWorkspace();
  for (let chapter = 0; chapter < CHAPTERS.length; chapter++) {
    applyChapter(state, chapter);
    assert.equal(state.journey!.today, CHAPTERS[chapter]!.today);
    const now = `${state.journey!.today}T23:59:59Z`;
    assert.ok(state.memberships!.every(m => !m.checkedInAt || m.checkedInAt <= now));
    assert.ok(state.events.every(e => !e.selfCheckedInAt || e.selfCheckedInAt <= now));
    assert.ok(state.events.every(e => e.kind === (e.endAt! <= now ? "past" : "upcoming")));
    for (const p of state.people) {
      for (const id of p.sharedEventIds!) {
        assert.ok(state.memberships!.some(m => m.personId === p.id && m.eventId === id && m.checkedInAt && m.approvalStatus === "approved"));
        assert.ok(state.events.find(e => e.id === id)!.selfCheckedInAt);
      }
    }
    assert.equal(summaryOf(state).peopleMet, 0);
    assert.equal(summaryOf(state).conversationsStarted, 0);
  }
  assert.ok(state.memberships!.some(m => m.approvalStatus === "approved" && !m.checkedInAt));
  assert.ok(state.memberships!.some(m => m.approvalStatus === "declined"));
  assert.ok(state.memberships!.some(m => m.approvalStatus === "waitlisted"));
});
test("advancement preserves manual reviews, follow-ups and drafts; due counts use demo date", () => {
  const state = createImportedWorkspace();
  applyChapter(state, 1);
  const person = state.people[0]!;
  Object.assign(person, { met: true, notes: "My manual note", draft: "My draft", status: "saved", dueDate: "2026-11-05", commitment: "My promise" });
  state.events[0]!.debrief = "My debrief";
  assert.equal(summaryOf(state).dueCount, 0);
  applyChapter(state, 2);
  assert.equal(summaryOf(state).dueCount, 1);
  applyChapter(state, 7);
  assert.equal(person.notes, "My manual note"); assert.equal(person.draft, "My draft");
  assert.equal(person.status, "saved"); assert.equal(person.commitment, "My promise"); assert.equal(person.met, true);
  assert.equal(state.events[0]!.debrief, "My debrief");
  assert.equal(summaryOf(state).conversationsStarted, 0);
});
test("templates use most recent actual shared event and nearest upcoming event without claiming a meeting there", () => {
  const state = createImportedWorkspace(); applyChapter(state, 3);
  const person = state.people[0]!; person.met = true;
  const draft = createDraft(state, person, "followup");
  assert.match(draft.text, /Community Workshop/); assert.doesNotMatch(draft.text, /meeting you at/);
  assert.match(createDraft(state, person, "invite").text, /Founders' Table/);
});
test("same-name debrief matches are skipped instead of attributing notes to both IDs", () => {
  const state = createImportedWorkspace(); applyChapter(state, 1);
  const result = debriefCandidates(state, state.events[0]!.id, "Alex Morgan shared a prototype. Maya Rowan discussed onboarding.");
  assert.equal(result.candidates.length, 1); assert.equal(result.candidates[0]!.name, "Maya Rowan");
  assert.equal(state.people[0]!.notes, "");
});
