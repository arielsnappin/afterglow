import { useQueryClient } from "@tanstack/react-query";
import {
  getGetSummaryQueryKey,
  getGetWorkspaceQueryKey,
  type Person,
  type Preferences,
  type Event as AgEvent,
  type Workspace,
} from "@workspace/api-client-react";
import { format, parseISO, isValid, differenceInCalendarDays } from "date-fns";

export function useInvalidateAll() {
  const qc = useQueryClient();
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: getGetWorkspaceQueryKey() }),
      qc.invalidateQueries({ queryKey: getGetSummaryQueryKey() }),
    ]);
}

const STOP = new Set(
  "a an and the of to in for on with at by from or is are be i me my we our you your it this that as into about more who want wants".split(" "),
);
export function tokens(s: string): string[] {
  return s
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2 && !STOP.has(t));
}

export interface Ranked {
  person: Person;
  score: number;
  matched: string[];
  reasons: string[];
}

/** Transparent ranking: shared tokens + open commitments + due dates. No percentages. */
export function rankPeople(people: Person[], prefs: Preferences, today = new Date(), eligibleOnly = true): Ranked[] {
  const want = new Set([...tokens(prefs.goal), ...prefs.interests.flatMap(tokens)]);
  return people
    .filter((p) => !p.dismissed && (!eligibleOnly || eligible(p)))
    .map((p) => {
      const theirs = new Set([...p.interests.flatMap(tokens), ...tokens(p.bio), ...tokens(p.role)]);
      const matched = [...want].filter((t) => theirs.has(t));
      const reasons: string[] = [];
      let score = matched.length * 2;
      if (p.sharedEventIds?.length) reasons.push(`${p.sharedEventIds.length} confirmed shared event${p.sharedEventIds.length === 1 ? "" : "s"} (not proof of a meeting)`);
      if (matched.length) reasons.push(`Matches your preferences: ${matched.slice(0, 3).join(", ")}`);
      if (p.commitment.trim() && p.status !== "replied") {
        score += 5;
        reasons.push("You made a commitment that's still open");
      }
      const due = dueInfo(p.dueDate, today);
      if (due && due.days <= 0 && p.status !== "replied") {
        score += 4;
        reasons.push(due.days < 0 ? "Follow-up is overdue" : "Follow-up is due today");
      } else if (due && due.days <= 3) {
        score += 2;
        reasons.push(`Due in ${due.days} day${due.days > 1 ? "s" : ""}`);
      }
      if (p.met) {
        score += 1;
        reasons.push("You recorded meeting in person");
      }
      if (p.status === "replied") score -= 3;
      return { person: p, score, matched, reasons };
    })
    .sort((a, b) => b.score - a.score || a.person.name.localeCompare(b.person.name));
}

export function dueInfo(d: string, today = new Date()) {
  if (!d) return null;
  const date = parseISO(d);
  if (!isValid(date)) return null;
  return { date, days: differenceInCalendarDays(date, today) };
}

export function fmtDate(d: string, f = "EEE, MMM d") {
  const x = parseISO(d);
  return isValid(x) ? format(x, f) : d;
}

export function isDue(p: Person, today = new Date()) {
  const d = dueInfo(p.dueDate, today);
  return eligible(p) && !!d && d.days <= 0 && p.status !== "replied" && !p.dismissed;
}

export const eligible = (p: Person) => p.sharedEventIds === undefined || p.sharedEventIds.length > 0;
// Use a calendar day, not the viewer's real clock or a UTC instant shifted by their timezone.
export const workspaceToday = (ws: Workspace) => ws.journey ? parseISO(ws.journey.today) : new Date();

export function eventPeople(ws: Workspace, event: AgEvent) {
  if (!ws.memberships) return ws.people.filter(p => p.eventIds.includes(event.id));
  const ids = new Set(ws.memberships.filter(m => m.eventId === event.id && m.approvalStatus === "approved" &&
    (event.kind === "upcoming" || !!m.checkedInAt)).map(m => m.personId));
  return ws.people.filter(p => ids.has(p.id));
}

export function recentSharedEvents(ws: Workspace, person: Person) {
  const cutoff = ws.journey ? new Date(`${ws.journey.today}T00:00:00Z`).getTime() - ws.journey.windowDays * 86400000 : -Infinity;
  return ws.events.filter(e => (person.sharedEventIds ?? person.eventIds).includes(e.id) && e.kind === "past" &&
    Date.parse(`${e.date}T00:00:00Z`) >= cutoff).sort((a, b) => b.date.localeCompare(a.date));
}

/** Status chips use semantic source roles, so they work in Night out and Day party alike.
 * zap = success (replied), sun = highlight (saved), pop-ink text = in motion (contacted). */
export const STATUS_META: Record<string, { label: string; cls: string }> = {
  suggested: { label: "Suggested", cls: "border border-line bg-glass text-ink-muted" },
  saved: { label: "Saved", cls: "border border-transparent bg-sun text-on-bright" },
  contacted: { label: "Contacted", cls: "border border-line bg-glass-strong text-pop-ink" },
  replied: { label: "Replied", cls: "border border-transparent bg-zap text-on-bright" },
};

export function eventsById(events: AgEvent[]) {
  return Object.fromEntries(events.map((e) => [e.id, e]));
}

export async function copyText(text: string): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    if (!navigator.clipboard) throw new Error("Clipboard is not available in this browser context");
    await navigator.clipboard.writeText(text);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Copy failed" };
  }
}

export type FollowUpView = "reach" | "waiting" | "all";

/** Which grouped view a stored status belongs to. Statuses themselves are never rewritten. */
export function followUpGroup(status: string): Exclude<FollowUpView, "all"> | "done" {
  if (status === "contacted") return "waiting";
  if (status === "replied") return "done";
  return "reach";
}

/**
 * Grouped follow-up lists.
 * - reach: eligible, non-dismissed suggested + saved (warm follow-ups, actual co-attendees only)
 * - waiting: contacted records (eligible + non-dismissed ranked first, then any other stored contacted records)
 * - all: every ranked record plus any stored contacted/replied record, even if now ineligible or dismissed
 */
export function groupFollowUps(people: Person[], prefs: Preferences, today = new Date()) {
  const ranked = rankPeople(people, prefs, today);
  const rankedIds = new Set(ranked.map((r) => r.person.id));
  const extra: Ranked[] = people
    .filter((p) => !rankedIds.has(p.id) && (p.status === "replied" || p.status === "contacted"))
    .map((person) => ({ person, score: 0, matched: [], reasons: [] }));
  const all = [...ranked, ...extra];
  return {
    reach: ranked.filter((r) => followUpGroup(r.person.status) === "reach"),
    waiting: all.filter((r) => r.person.status === "contacted"),
    all,
  };
}

/** Compare saved vs edited preferences: top warm follow-ups and whether order changed. */
export function compareRankings(people: Person[], saved: Preferences, edited: Preferences, today = new Date(), n = 5) {
  const warm = (p: Preferences) => rankPeople(people, p, today).filter((r) => followUpGroup(r.person.status) === "reach").slice(0, n);
  const before = warm(saved);
  const after = warm(edited);
  const changed = before.map((r) => r.person.id).join("|") !== after.map((r) => r.person.id).join("|");
  return { before, after, changed };
}

/** Eligible example people with recorded interests, for the "More people like" shortcut. */
export function moreLikeCandidates(people: Person[], max = 4) {
  return people.filter((p) => eligible(p) && !p.dismissed && p.interests.length > 0).slice(0, max);
}

/** Recorded interests from an example person that aren't already in the list (case-insensitive). Never invents traits. */
export function interestsToAdd(current: string[], person: Pick<Person, "interests">, limit = 20) {
  const have = new Set(current.map((i) => i.toLowerCase()));
  const add = person.interests.map((i) => i.trim().slice(0, 80)).filter((i) => {
    if (!i || have.has(i.toLowerCase())) return false;
    have.add(i.toLowerCase());
    return true;
  });
  return [...current, ...add].slice(0, limit);
}
