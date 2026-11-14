import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { Router } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@workspace/afterglow-design-system/components/ui/tooltip";
import { Shell } from "../src/components/shell";
import Home from "../src/pages/home";
import FollowUps from "../src/pages/follow-ups";
import Profile from "../src/pages/settings";
import Connections from "../src/pages/imports";
import People from "../src/pages/people";
import { ConnectionLadder, DraftPreview, Rise, StepHero } from "../src/components/onboarding/tour-visuals";
import { cleanInterests, draftDiffers, loadTour, saveTour, validateProfile } from "../src/components/onboarding/tour-state";
import {
  groupFollowUps, followUpGroup, compareRankings, moreLikeCandidates, interestsToAdd,
  rankPeople, workspaceToday, dueInfo, eventPeople,
} from "../src/lib/afterglow";
import { person, workspace } from "./api-fixture";

const read = (path: string) => readFileSync(`src/${path}`, "utf8");
const today = new Date(2026, 10, 5);
const prefs = workspace.preferences;
const render = (element: React.ReactNode, path = "/") => renderToStaticMarkup(
  <QueryClientProvider client={new QueryClient()}>
    <Router ssrPath={path}><TooltipProvider>{element}</TooltipProvider></Router>
  </QueryClientProvider>,
);
const ids = (rows: { person: { id: string } }[]) => rows.map(r => r.person.id).sort();

test("grouped views preserve statuses and exclude registrations/dismissals from warm outreach", () => {
  const people = [...workspace.people,
    person("old-reply", "replied", { dismissed: true, sharedEventIds: [] }),
    person("old-contact", "contacted", { dismissed: true, sharedEventIds: [] }),
  ];
  const original = structuredClone(people);
  const groups = groupFollowUps(people, prefs, today);
  assert.deepEqual(ids(groups.reach), ["saved", "suggested"]);
  assert.deepEqual(ids(groups.waiting), ["contacted", "old-contact"]);
  assert.ok(ids(groups.all).includes("old-reply"));
  assert.equal(followUpGroup("replied"), "done");
  assert.deepEqual(people, original, "views must not migrate or mutate stored states");
  const html = render(<FollowUps />);
  for (const label of ["To reach out", "Waiting for reply", "All"]) assert.ok(html.includes(label));
  assert.ok(html.includes("row-followup-suggested"));
  assert.ok(html.includes("row-followup-saved"));
  assert.ok(!html.includes("row-followup-contacted"));
  assert.ok(!html.includes("row-followup-registration"));
  assert.ok(html.indexOf('data-testid="button-reach-out-saved"') < html.indexOf('data-testid="select-status-saved"'));
});

test("preference examples use real recorded interests without persisting or inventing traits", () => {
  const current = ["community"];
  const p = person("example", "suggested", { interests: ["COMMUNITY", "gardening", "Gardening", ""] });
  const shortcut = interestsToAdd(current, p);
  assert.deepEqual(shortcut, ["community", "gardening"]);
  assert.deepEqual(current, ["community"]);
  assert.equal(interestsToAdd(Array.from({ length: 20 }, (_, i) => `topic${i}`), p).length, 20);
  assert.ok(!moreLikeCandidates(workspace.people).some(p => p.id === "registration" || p.dismissed));
  const garden = person("garden", "suggested", { interests: ["gardening"], role: "", bio: "" });
  const community = person("community", "saved", { interests: ["community"], role: "", bio: "" });
  const people = [community, garden, person("outsider", "suggested", { sharedEventIds: [], interests: ["gardening"] })];
  const saved = { goal: "community", interests: [] };
  const edited = { goal: "gardening", interests: [] };
  const cmp = compareRankings(people, saved, edited, today);
  assert.equal(cmp.changed, true);
  assert.equal(cmp.before[0].person.id, "community");
  assert.equal(cmp.after[0].person.id, "garden");
  assert.equal(compareRankings(people, saved, saved, today).changed, false);
  assert.deepEqual(compareRankings([], saved, edited, today).after, []);
  assert.deepEqual(saved, { goal: "community", interests: [] });
  const html = render(<Profile />);
  assert.ok(html.includes("How your preferences shape follow-ups"));
  assert.ok(html.includes("More people like"));
  assert.ok(!html.includes("Live ranking preview"));
  assert.ok(!html.includes("button-more-like-registration"));
  assert.match(read("pages/settings.tsx"), /await invalidate\(\)/);
  assert.match(read("lib/afterglow.ts"), /invalidateQueries\(\{ queryKey: getGetWorkspaceQueryKey\(\)/);
  assert.match(read("lib/afterglow.ts"), /invalidateQueries\(\{ queryKey: getGetSummaryQueryKey\(\)/);
});

test("Home celebrates honest participation metrics and keeps outreach primary", () => {
  const html = render(<Home />);
  for (const label of ["Keep good connections going.", "Events attended", "People you met", "Conversations started", "Warm follow-ups", "Reach out", "Up next"]) assert.ok(html.includes(label), label);
  assert.ok(!html.includes("Recent rooms"));
  assert.ok(!html.includes("button-priority-contacted"));
  assert.ok(!html.includes("button-priority-registration"));
  assert.match(read("pages/home.tsx"), /s\?\.peopleMet/);
  assert.match(read("pages/home.tsx"), /s\?\.eventsAttended/);
});

test("navigation labels, active routes and compact accessibility survive without global demo notices", () => {
  const html = render(<Shell><p>Page</p></Shell>, "/imports");
  const labels = ["Home", "Follow-ups", "People", "Events", "Integrations", "Profile"];
  for (const label of labels) assert.ok(html.includes(`aria-label="${label}"`), label);
  for (let i = 1; i < labels.length; i++) {
    assert.ok(html.indexOf(`aria-label="${labels[i - 1]}"`) < html.indexOf(`aria-label="${labels[i]}"`));
  }
  const connectionsLink = html.match(/<a[^>]*data-testid="link-nav-integrations"[^>]*>/)?.[0] ?? "";
  assert.ok(connectionsLink.includes('href="/integrations"'));
  assert.ok(connectionsLink.includes('aria-current="page"'));
  const canonical = render(<Shell><p>Page</p></Shell>, "/integrations");
  assert.match(canonical, /<a[^>]*aria-current="page"[^>]*data-testid="link-nav-integrations"/);
  assert.ok(html.includes('data-testid="button-open-tour"'));
  assert.ok(html.includes('data-testid="button-open-tour-mobile"'));
  const storyLink = html.match(/<a[^>]*data-testid="link-build-story"[^>]*>/)?.[0] ?? "";
  assert.ok(storyLink.includes('href="/afterglow-demo.html"'));
  assert.ok(storyLink.includes('target="_blank"'));
  assert.ok(storyLink.includes('rel="noopener noreferrer"'));
  assert.ok(storyLink.includes("opens in a new tab"));
  assert.ok(storyLink.includes('aria-label="Builder notes (opens in a new tab)"'));
  assert.ok(html.indexOf('data-testid="link-build-story"') > html.indexOf('data-testid="button-theme-toggle"'));
  assert.ok(html.indexOf('data-testid="link-build-story-mobile"') > html.indexOf('data-testid="button-theme-toggle-mobile"'));
  assert.ok(!(html.match(/<nav\b[\s\S]*?<\/nav>/)?.[0] ?? "").includes("link-build-story"));
  assert.match(read("App.tsx"), /path="\/imports" component=\{ImportsPage\}/);
  assert.match(read("App.tsx"), /path="\/integrations" component=\{ImportsPage\}/);
  assert.ok(!html.includes("Fictional data"));
  assert.ok(!html.includes("Demo workspace"));
  assert.ok(!html.includes("text-demo-guidance"));
  assert.ok(!html.includes("Demo only"));
  assert.ok(html.includes('data-testid="button-theme-toggle"'));
  assert.ok(html.includes('data-testid="button-theme-toggle-mobile"'));
  const source = read("components/shell.tsx");
  assert.match(source, /localStorage\.getItem\(COLLAPSE_KEY\)/);
  assert.match(source, /localStorage\.setItem\(COLLAPSE_KEY, collapsed/);
  assert.match(source, /aria-expanded=\{!collapsed\}/);
  assert.match(source, /Expand navigation/);
  assert.match(source, /Collapse navigation/);
  assert.match(source, /md:sr-only/);
  assert.ok(!source.includes("FlaskConical"));
  assert.ok(!source.includes("Tooltip"));
  assert.match(source, /<main[^>]*><DemoController className="mb-6" \/>/);
  assert.match(source, /<ThemeSwitch compact=\{collapsed\} \/>\s*<BuilderNotesLink compact=\{collapsed\} \/>\s*<\/div>\s*<\/aside>/);
  const originalWindow = globalThis.window;
  try {
    globalThis.window = { localStorage: { getItem: () => "1" } } as unknown as Window & typeof globalThis;
    const compact = render(<Shell><p>Compact page</p></Shell>, "/people");
    assert.ok(compact.includes('data-collapsed="true"'));
    assert.ok(compact.includes('aria-expanded="false"'));
    assert.ok(compact.includes('aria-label="Expand navigation"'));
    assert.ok(compact.includes('aria-label="People"'));
    assert.ok(!compact.includes("Demo privacy guidance"));
    assert.ok(!compact.includes("text-demo-guidance"));
    assert.ok(compact.includes('data-testid="button-theme-toggle"'));
    assert.ok(compact.includes('aria-label="Builder notes (opens in a new tab)"'));
  } finally {
    if (originalWindow === undefined) delete (globalThis as { window?: unknown }).window;
    else globalThis.window = originalWindow;
  }
});

test("Profile and Integrations retain contextual safety guidance in both navigation states", () => {
  const originalWindow = globalThis.window;
  try {
    for (const collapsed of ["0", "1"]) {
      globalThis.window = { localStorage: { getItem: () => collapsed } } as unknown as Window & typeof globalThis;
      for (const [path, page] of [["/settings", <Profile />], ["/imports", <Connections />]] as const) {
        const html = render(<Shell>{page}</Shell>, path);
        assert.ok(html.includes(`data-collapsed="${collapsed === "1"}"`));
        assert.ok(!html.includes("text-demo-guidance"));
        assert.ok(!html.includes("Fictional data"));
        assert.ok(!html.includes("Demo workspace"));
        const aside = html.match(/<aside\b[\s\S]*?<\/aside>/)?.[0] ?? "";
        assert.ok(aside.length > 0);
        assert.ok(!aside.includes("ag-glass"), "no empty demo card remains");
        assert.ok(!aside.includes("personal data"), "guidance belongs at inputs, not in navigation");
        assert.ok(html.includes('data-testid="button-theme-toggle"'));
        assert.ok(html.includes('data-testid="button-theme-toggle-mobile"'));
        if (path === "/settings") {
          assert.ok(html.includes("Demo only, don&#x27;t enter personal data."));
        } else {
          assert.ok(html.includes('data-testid="text-synthetic-warning"'));
          assert.ok(html.includes("Don&#x27;t upload real personal data."));
        }
      }
    }
  } finally {
    if (originalWindow === undefined) delete (globalThis as { window?: unknown }).window;
    else globalThis.window = originalWindow;
  }
  assert.match(read("components/person-sheet.tsx"), /Demo workspace: don't enter real personal data/);
  assert.match(read("pages/event-detail.tsx"), /fictional people here only/);
});

test("integrations identify unavailable providers while retaining the synthetic import contract", () => {
  const html = render(<Connections />);
  for (const label of ["Integrations", "Luma", "Google Calendar", "Eventbrite", "Pinterest", "CSV import", "Synthetic data only.", "Not available yet"]) assert.ok(html.includes(label));
  assert.match(html, /data-testid="button-unavailable-google-calendar"/);
  assert.match(html, /data-testid="button-unavailable-pinterest"/);
  assert.match(html, /<button[^>]*disabled=""[^>]*data-testid="button-unavailable-eventbrite"/);
  const source = read("pages/imports.tsx");
  for (const id of ["button-preview", "button-commit", "button-retry-preview", "button-retry-commit", "button-cancel-commit", "input-csv-file", "link-download-sample"]) assert.ok(source.includes(id));
  assert.match(source, /prefers-reduced-motion: reduce/);
  assert.match(source, /readVersion\.current/);
  assert.match(source, /MAX_BYTES = 48000/);
  assert.match(source, /usePreviewSyntheticImport/);
  assert.match(source, /useCommitSyntheticImport/);
  const controller = read("components/demo-controller.tsx");
  for (const id of ["button-advance-chapter", "button-reset-demo", "button-reset-cancel", "button-reset-confirm"]) assert.ok(controller.includes(id));
  assert.match(controller, /confirm: true/);
});

test("People is a CRM table without treating registration as attendance or a meeting", () => {
  const html = render(<People />, "/people");
  assert.ok(html.includes("<table"));
  for (const label of ["Person", "Event context", "Met", "Follow-up", "Next action", "Note"]) assert.ok(html.includes(label));
  for (const p of workspace.people) {
    assert.ok(html.includes(`data-testid="row-person-${p.id}"`));
    assert.ok(html.includes(`data-testid="card-person-${p.id}"`), "existing person opener remains available");
    assert.ok(html.includes(`aria-label="Open ${p.name}"`));
  }
  const registration = html.match(/<tr[^>]*data-testid="row-person-registration"[\s\S]*?<\/tr>/)?.[0] ?? "";
  assert.ok(registration.includes("Attendance not confirmed"));
  assert.ok(registration.includes("Registered only"));
  assert.ok(registration.includes("Not met"));
  assert.ok(!registration.includes("Attended together"));
  assert.ok(html.includes('aria-label="Search people"'));
  assert.ok(html.includes('aria-label="Sort people"'));
  assert.ok(html.includes('aria-label="Filter by follow-up status"'));
});

test("tour progress tolerates invalid storage and remembers only tour progress", () => {
  const originalWindow = globalThis.window;
  let value: string | null = null;
  try {
    globalThis.window = { localStorage: {
      getItem: () => value,
      setItem: (_key: string, v: string) => { value = v; },
    } } as unknown as Window & typeof globalThis;
    assert.deepEqual(loadTour(), { status: "new", step: 0 });
    saveTour({ status: "dismissed", step: 2 });
    assert.deepEqual(loadTour(), { status: "dismissed", step: 2 });
    saveTour({ status: "completed", step: 0 });
    assert.deepEqual(loadTour(), { status: "completed", step: 0 });
    assert.deepEqual(Object.keys(JSON.parse(value!)).sort(), ["status", "step"]);
    for (const corrupt of ["not JSON", "null", '{"step":100}', '{"step":-1}', '{"step":"2"}']) {
      value = corrupt;
      assert.deepEqual(loadTour(), { status: "new", step: 0 });
    }
    globalThis.window = { localStorage: {
      getItem: () => { throw new Error("Storage blocked"); },
      setItem: () => { throw new Error("Storage blocked"); },
    } } as unknown as Window & typeof globalThis;
    assert.deepEqual(loadTour(), { status: "new", step: 0 });
    assert.doesNotThrow(() => saveTour({ status: "dismissed", step: 1 }));
  } finally {
    if (originalWindow === undefined) delete (globalThis as { window?: unknown }).window;
    else globalThis.window = originalWindow;
  }
});

test("onboarding saves pending topics without silently truncating or dropping edits", () => {
  const saved = { goal: "Find a mentor", interests: ["Design"] };
  const draft = { ...saved, interests: [...saved.interests], entry: " Community " };
  assert.equal(draftDiffers(draft, saved), true);
  assert.deepEqual(validateProfile(draft), { ok: true, goal: saved.goal, interests: ["Design", "Community"] });
  assert.equal(draft.entry, " Community ", "validation never mutates unsaved input");
  assert.deepEqual(validateProfile({ ...draft, entry: "design" }), { ok: true, goal: saved.goal, interests: ["Design"] });
  assert.deepEqual(cleanInterests([" Design ", "design", " ", "Community"]), ["Design", "Community"]);
  assert.equal(validateProfile({ ...draft, goal: " " }).ok, false);
  assert.equal(validateProfile({ ...draft, goal: "x".repeat(501) }).ok, false);
  assert.equal(validateProfile({ ...draft, entry: "x".repeat(81) }).ok, false);
  const full = { ...draft, interests: Array.from({ length: 20 }, (_, i) => `Topic ${i}`), entry: "New topic" };
  assert.equal(validateProfile(full).ok, false);
  assert.equal(validateProfile({ ...full, entry: "topic 0" }).ok, true, "a duplicate does not exceed the limit");
  assert.equal(draftDiffers({ ...saved, entry: "" }, saved), false);
  assert.equal(draftDiffers(null, saved), false);
});

test("onboarding examples distinguish fictional attendance and drafts from real actions", () => {
  const ladder = render(<ConnectionLadder />);
  for (const label of ["Fictional example", "Registered", "Attended", "Met", "Still not a meeting", "Only you mark this"]) {
    assert.ok(ladder.includes(label), label);
  }
  const draft = render(<DraftPreview />);
  assert.ok(draft.includes("Fictional draft"));
  assert.ok(draft.includes("Not sent. You copy and send it yourself."));
  assert.ok(!draft.includes("<button"), "illustrative content cannot imply a real send action");
  const hero = render(<StepHero tone="pop" kicker="Welcome" flourish="Hello">Your space</StepHero>);
  assert.ok(hero.includes("ag-glass"));
  assert.ok(hero.includes("type-flourish"));
});

test("onboarding motion uses shared timing and preserves input and closing lifecycles", () => {
  const html = render(<Rise i={2}><p>Always readable</p></Rise>);
  assert.ok(html.includes("var(--motion-duration-fast)"));
  assert.ok(html.includes("var(--motion-duration-slow)"));
  assert.ok(html.includes("motion-reduce:animate-none"));
  assert.ok(html.includes("ease-standard"));
  const source = read("components/onboarding/onboarding-tour.tsx");
  assert.match(source, /onCloseAutoFocus=.*tour\.restoreFocus\(\)/);
  assert.match(source, /<div key=\{step\}>/);
  assert.ok(!source.includes("key={draft"), "editing must not remount the profile");
  assert.ok(!source.includes("AnimatePresence"), "exit transitions must not duplicate interactive profile forms");
  assert.match(source, /DialogHeader className="shrink-0/);
  assert.match(source, /flex shrink-0 flex-wrap.*border-t/);
});

test("person context edits remain separate from copying and do not invent a history", () => {
  const source = read("components/person-sheet.tsx");
  for (const id of ["input-draft", "input-notes", "input-commitment", "input-next-action", "input-due-date", "switch-met", "switch-dismissed", "button-save-person"]) assert.ok(source.includes(id));
  assert.ok(source.indexOf('data-testid="input-draft"') < source.indexOf('data-testid="input-notes"'));
  assert.match(source, /not a dated history/);
  const copy = source.slice(source.indexOf("const copy ="), source.indexOf("return (", source.indexOf("const copy =")));
  assert.match(copy, /copyText\(f\.draft\)/);
  assert.ok(!copy.includes("mutate"));
  assert.ok(!copy.includes('set("status"'));
  assert.match(source, /draft: metChanged \? "" : f\.draft/);
  assert.match(source, /await invalidate\(\)/);
});

test("narrow layouts can shrink their panels and status controls have an independent focus ring", () => {
  assert.match(read("components/bits.tsx"), /cn\("min-w-0", className\)/);
  assert.match(read("pages/settings.tsx"), /grid-cols-1/);
  assert.match(read("pages/settings.tsx"), /className="min-w-0 flex-1"/);
  assert.match(read("pages/event-detail.tsx"), /grid-cols-1/);
  assert.match(read("pages/follow-ups.tsx"), /focus-visible:ring-3 focus-visible:ring-focus/);
});

test("shared attendance, ranking and due dates keep following the demo clock", () => {
  const ws = { ...workspace, journey: { today: "2026-11-05" } };
  assert.equal(dueInfo("2026-11-05", workspaceToday(ws))?.days, 0);
  assert.equal(rankPeople([person("no-attendance", "saved", { sharedEventIds: [] })], prefs, today).length, 0);
  const people = [person("checked-in"), person("only-approved")];
  const withEvidence = { ...workspace, people, memberships: [
    { personId: "checked-in", eventId: "event", approvalStatus: "approved", checkedInAt: "2026-11-03T18:00:00Z" },
    { personId: "only-approved", eventId: "event", approvalStatus: "approved", checkedInAt: "" },
  ] };
  assert.deepEqual(eventPeople(withEvidence, workspace.events[0]).map(p => p.id), ["checked-in"]);
  assert.ok(people.every(p => !p.met), "attendance must never imply a recorded meeting");
});
