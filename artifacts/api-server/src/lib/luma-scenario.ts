import type { Workspace } from "./demo-seed";

export const SCENARIO = "afterglow-fictional-four-weeks-v1";
export const MAX_CSV_BYTES = 48000;
export const HEADERS = [
  "event_id", "calendar_id", "event_name", "start_at", "end_at", "timezone", "url", "geo_address_json",
  "guest_id", "user_id", "user_name", "user_email", "approval_status", "registered_at",
  "ticket_id", "ticket_checked_in_at", "demo_scenario", "demo_self_checked_in_at",
];
const names = ["Maya Rowan", "Jules Avery", "Alex Morgan", "Alex Morgan", "Nia Vale", "Theo Finch",
  "Ada Moss", "Leo Wren", "Iris Reed", "Owen Lake", "Zara Pine", "Kai Brooks", "Eva Stone",
  "Noah Ash", "Lila Birch", "Eli Fern", "Aria Cove", "Finn Elm", "Milo Sage", "Cleo Hart",
  "Remy West", "Sana Bloom", "Tess River", "Ari Sol"];
const titles = ["Builders, Tea & Ideas", "Design After Hours", "Community Workshop", "Founders' Table", "Prototype Exchange", "Next Chapter Breakfast"];
const dates = ["2026-11-03", "2026-11-07", "2026-11-10", "2026-11-16", "2026-11-20", "2026-11-27"];
export const CHAPTERS = [
  { today: "2026-11-02", title: "Prepare for the first room", changes: "Six events and 24 fictional profiles imported. These are registrations only: no attendance or meetings yet." },
  { today: "2026-11-04", title: "First attendance and debrief", changes: "The first event ended. Ticket check-ins and your demo-defined self-attendance are now available. Review the optional scenario debrief; nothing is marked met." },
  { today: "2026-11-05", title: "Review your follow-ups", changes: "Time moved forward one day. Review notes, set a follow-up date and save a draft yourself. No outreach or reviews are performed automatically." },
  { today: "2026-11-11", title: "Familiar faces across rooms", changes: "Two more events ended. Confirmed repeat shared attendance can now be shown within this demo's 28-day window. Shared attendance does not prove a meeting." },
  { today: "2026-11-17", title: "A new room, recurring people", changes: "Founders' Table attendance is available. Your own notes, meeting flags and follow-up edits were preserved." },
  { today: "2026-11-21", title: "Prepare the next conversation", changes: "Prototype Exchange ended. Use the upcoming breakfast to prepare with actual shared-attendance context, not assumptions about registrations." },
  { today: "2026-11-25", title: "Before the breakfast", changes: "The breakfast is still upcoming. Due labels now reflect November 25. No future check-ins or outreach results have been released." },
  { today: "2026-11-28", title: "Four weeks of follow-through", changes: "All six events ended. Review the final attendance and debriefs; meetings, notes and sent/replied statuses still require your explicit edits." },
];

export function scenarioRows(): string[][] {
  return dates.flatMap((date, e) => {
    const indexes = [...new Set([0, 1, 2, 3, ...Array.from({ length: 6 }, (_, n) => 4 + (e * 4 + n) % 20)])];
    return indexes.map((p, n) => {
      const approval = n === 9 ? (e % 2 ? "declined" : "waitlisted") : "approved";
      return [
        `luma-demo-e${e + 1}`, "demo-calendar", titles[e]!, `${date}T18:00:00Z`, `${date}T20:00:00Z`, "Etc/UTC",
        `https://example.com/events/demo-${e + 1}`, JSON.stringify({ city: "Fictional Harbor", address: `Studio ${e + 1}` }),
        `demo-g${e}-${p}`, `demo-u${p}`, names[p]!, `person${p}@example.com`, approval, "2026-11-01T12:00:00Z",
        `demo-t${e}-${p}`, approval === "approved" && n !== 8 ? `${date}T18:05:00Z` : "",
        SCENARIO, `${date}T18:02:00Z`,
      ];
    });
  });
}

export function sampleCsv(): string {
  const quote = (s: string) => `"${s.replaceAll('"', '""')}"`;
  return [HEADERS, ...scenarioRows()].map(row => row.map(quote).join(",")).join("\r\n") + "\r\n";
}

/** RFC4180-style bounded parser. Only the exact supported scenario is accepted downstream. */
export function parseCsv(csv: string): string[][] {
  if (Buffer.byteLength(csv, "utf8") > MAX_CSV_BYTES) throw new Error("File is too large. Use the sample CSV (maximum 48,000 bytes).");
  const rows: string[][] = [];
  let row: string[] = [], field = "", quoted = false, closed = false;
  const cell = () => { row.push(field); field = ""; closed = false; };
  const line = () => { cell(); rows.push(row); row = []; };
  csv = csv.replace(/^\uFEFF/, "");
  for (let i = 0; i < csv.length; i++) {
    const c = csv[i]!;
    if (quoted) {
      if (c === '"') {
        if (csv[i + 1] === '"') { field += '"'; i++; }
        else { quoted = false; closed = true; }
      } else field += c;
    } else if (c === ",") cell();
    else if (c === "\n" || c === "\r") { if (c === "\r" && csv[i + 1] === "\n") i++; line(); }
    else if (c === '"' && !field && !closed) quoted = true;
    else {
      if (c === '"' || closed) throw new Error("Malformed CSV quoting. Download a fresh fictional sample.");
      field += c;
    }
    if (rows.length > 100) throw new Error("Too many rows. Only the bundled synthetic scenario is supported.");
  }
  if (quoted) throw new Error("Unclosed quoted CSV field.");
  if (field || row.length || closed) line();
  return rows;
}

export function normalizeImport(source: "provider" | "csv", csv?: string) {
  if (source === "csv" && !csv) throw new Error("Choose the downloaded synthetic CSV first.");
  const [header, ...rows] = parseCsv(source === "provider" ? sampleCsv() : csv!);
  if (JSON.stringify(header) !== JSON.stringify(HEADERS)) throw new Error("Unsupported headers. Use the Luma-inspired synthetic sample, not a real export.");
  const expected = new Map(scenarioRows().map(row => [row[8], row]));
  if (rows.length !== expected.size) throw new Error("The sample must contain all 60 fictional guest rows, with no duplicates or missing rows.");
  const seen = new Set<string>();
  for (const row of rows) {
    if (row.length !== HEADERS.length) throw new Error("Each row must have all 18 columns. Check commas and quoting.");
    for (const index of [3, 4, 13, 15, 17]) {
      if (row[index] && (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(row[index]!) ||
        !Number.isFinite(Date.parse(row[index]!)) || new Date(row[index]!).toISOString().replace(".000Z", "Z") !== row[index])) {
        throw new Error("Invalid timestamp. Use the unchanged sample's ISO UTC timestamps.");
      }
    }
    try { new Intl.DateTimeFormat("en", { timeZone: row[5] }).format(); }
    catch { throw new Error("Invalid IANA timezone."); }
    if (!/@example\.(com|org|net)$/.test(row[11]!)) throw new Error("Only reserved example-domain fictional emails are supported. Do not upload personal data.");
    if (seen.has(row[8]!)) throw new Error("Duplicate guest identity in the CSV.");
    seen.add(row[8]!);
    if (JSON.stringify(expected.get(row[8])) !== JSON.stringify(row)) throw new Error("Unsupported content. Only the unchanged fictional sample is accepted; no real uploads. The demo marker is not a privacy guarantee.");
  }
  return {
    eventCount: 6, peopleCount: 24, guestCount: rows.length,
    startDate: dates[0]!, endDate: dates[5]!, duplicate: false, committed: false,
    stages: ["Reading events", "Matching people by source IDs", "Checking ticket attendance evidence"],
  };
}

export function createImportedWorkspace(): Workspace {
  const rows = scenarioRows();
  const state: Workspace = {
    isDemo: true, events: [], people: [], memberships: [],
    preferences: { goal: "Meet thoughtful product and community builders", interests: ["Product", "Community", "Design"] },
  };
  for (let e = 0; e < 6; e++) {
    const row = rows.find(r => r[0] === `luma-demo-e${e + 1}`)!;
    state.events.push({
      id: row[0]!, title: row[2]!, date: dates[e]!, startAt: row[3], endAt: row[4], timezone: row[5],
      time: "18:00 – 20:00 UTC", location: `Studio ${e + 1} · Fictional Harbor`, host: "Fictional Harbor Collective",
      description: "A fictional gathering for the Afterglow four-week scenario. Registration is not attendance; co-attendance is not a meeting.",
      kind: "upcoming", source: "Luma-inspired synthetic scenario", tags: ["Product", "Community"], debrief: "",
      color: ["#527d6b", "#b66f80", "#8671a6", "#b58b3c", "#bb6a4e", "#587f9c"][e]!, attendanceLabel: "Registered guests — attendance not confirmed",
    });
  }
  names.forEach((name, p) => {
    const id = `demo-u${p}`;
    state.people.push({
      id, sourceUserId: id, email: `person${p}@example.com`, name, initials: name.split(" ").map(n => n[0]).join(""),
      role: p % 2 ? "Community designer" : "Product builder", company: `Fictional Studio ${p + 1}`,
      color: "#527d6b", bio: "Fictional profile interested in thoughtful product and community building.",
      interests: ["Product", "Community", ...(p % 2 ? ["Design"] : [])],
      eventIds: rows.filter(r => r[9] === id).map(r => r[0]!), sharedEventIds: [],
      met: false, notes: "", evidence: [], commitment: "", status: "suggested", draft: "", nextAction: "", dueDate: "", dismissed: false,
      source: "Luma-inspired synthetic profile", linkedinUrl: null,
    });
  });
  applyChapter(state, 0);
  return state;
}

/** Release only clock-eligible provider evidence; never overwrite user-authored fields. */
export function applyChapter(state: Workspace, chapter: number): void {
  const definition = CHAPTERS[chapter];
  if (!definition) throw new Error("Unknown chapter.");
  state.journey = { ...definition, scenario: SCENARIO, chapter, windowDays: 28 };
  const now = `${definition.today}T23:59:59Z`;
  const released = (value: string) => value && value <= now ? value : "";
  state.memberships = scenarioRows().map(r => ({
    eventId: r[0]!, personId: r[9]!, guestId: r[8]!, ticketId: r[14]!,
    approvalStatus: r[12] as "approved" | "declined" | "waitlisted", registeredAt: r[13]!, checkedInAt: released(r[15]!),
  }));
  state.events.forEach((event, index) => {
    event.kind = event.endAt! <= now ? "past" : "upcoming";
    event.selfCheckedInAt = released(`${dates[index]}T18:02:00Z`);
    event.attendanceLabel = event.kind === "past" ? "Confirmed ticket check-ins (not meetings)" : "Approved registrations (not attendance)";
    event.scenarioDebrief = event.kind === "past"
      ? "Optional fictional writing prompt — edit to reflect the scenario you want to review: Maya Rowan discussed community onboarding. Jules Avery shared a product prototype. This prompt is not evidence that you met either person." : "";
  });
  state.people.forEach(person => {
    person.sharedEventIds = state.memberships!.filter(m => m.personId === person.id && m.approvalStatus === "approved" &&
      m.checkedInAt && state.events.some(e => e.id === m.eventId && e.selfCheckedInAt)).map(m => m.eventId);
    person.evidence = person.sharedEventIds.map(id => `Synthetic ticket check-in and demo self-attendance confirmed at ${state.events.find(e => e.id === id)!.title}. This does not prove a meeting.`);
  });
}

export function eligiblePerson(person: Workspace["people"][number]): boolean {
  return person.sharedEventIds === undefined || person.sharedEventIds.length > 0;
}

export function summaryOf(state: Workspace) {
  const today = state.journey?.today ?? new Date().toISOString().slice(0, 10);
  const eligible = state.people.filter(eligiblePerson);
  return {
    eventsAttended: state.events.filter(e => e.kind === "past" && (state.journey ? !!e.selfCheckedInAt : true)).length,
    peopleMet: state.people.filter(p => p.met).length,
    openFollowups: eligible.filter(p => !p.dismissed && (p.status === "suggested" || p.status === "saved")).length,
    conversationsStarted: state.people.filter(p => p.status === "contacted" || p.status === "replied").length,
    dueCount: eligible.filter(p => !p.dismissed && p.status !== "replied" && p.dueDate && p.dueDate <= today).length,
  };
}
