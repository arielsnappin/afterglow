import type { Person, Workspace } from "./demo-seed";

export function createDraft(
  state: Workspace, person: Person, mode: "followup" | "idea" | "invite",
): { text: string; explanation: string } {
  const name = person.name.split(" ")[0];
  const event = state.events.filter(e => (person.sharedEventIds ?? person.eventIds).includes(e.id) && e.kind === "past")
    .sort((a, b) => b.date.localeCompare(a.date))[0];
  const upcoming = state.events.filter(e => e.kind === "upcoming").sort((a, b) => a.date.localeCompare(b.date))[0];
  // A global meeting flag cannot identify which of several rooms contained the meeting.
  const greeting = person.met && event && !state.journey
    ? `Hi ${name}, it was lovely meeting you at ${event.title}.`
    : event
      ? state.journey
        ? `Hi ${name}, we both attended ${event.title}. I wanted to ${person.met ? "get in touch" : "introduce myself"}.`
        : `Hi ${name}, I saw that we both registered for ${event.title}. I wanted to introduce myself.`
      : `Hi ${name}, I came across your profile on the event's registration list and wanted to introduce myself.`;
  let body: string;
  if (mode === "idea") {
    const topic = person.interests.find(interest =>
      state.preferences.interests.some(value => value.toLowerCase() === interest.toLowerCase()));
    body = `I'm curious about ${topic ?? person.interests[0] ?? "what you're building"}. Would you be open to a short conversation to compare perspectives and see whether there's a small idea worth exploring together?`;
  } else if (mode === "invite" && upcoming) {
    body = `I'm planning to join ${upcoming.title} on ${upcoming.date}. Would you be interested in catching up there? No pressure if it's not your thing.`;
  } else if (person.met && person.commitment) {
    body = `I noted a follow-up for myself: “${person.commitment}” I'd like to follow through and keep the conversation going. Would you be open to a quick catch-up?`;
  } else {
    body = `Your work${person.company !== "Independent" ? ` at ${person.company}` : ""} caught my interest. I'd love to learn more about your perspective on ${person.interests[0]?.toLowerCase() ?? "building useful products"}. Would you be open to a short conversation?`;
  }
  return {
    text: `${greeting}\n\n${body}`,
    explanation: "Template-based suggestion using the demo profile and your recorded meeting status. Not AI research, not sent, and not proof of the other person's interests in collaborating. Edit and verify before use.",
  };
}

export function debriefCandidates(state: Workspace, eventId: string, text: string) {
  const candidates = state.people
    .filter(person => (state.journey ? person.sharedEventIds : person.eventIds)?.includes(eventId))
    .map(person => {
      const full = person.name.toLowerCase();
      const first = full.split(" ")[0];
      const sameFull = state.people.filter(p => p.eventIds.includes(eventId) && p.name.toLowerCase() === full).length;
      if (sameFull > 1) return { personId: person.id, name: person.name, notes: "" };
      const sameFirst = state.people.filter(p => p.eventIds.includes(eventId) && p.name.toLowerCase().split(" ")[0] === first).length;
      const snippets = text.split(/(?<=[.!?])\s+|\n+/).filter(line => {
        const normalized = line.toLowerCase();
        const tokens: string[] = normalized.match(/[\p{L}\p{N}]+/gu) ?? [];
        return normalized.includes(full) || (sameFirst === 1 && first !== undefined && tokens.includes(first));
      });
      return { personId: person.id, name: person.name, notes: snippets.join(" ").trim() };
    }).filter(candidate => candidate.notes.length > 0);
  return {
    candidates,
    explanation: "Simple name matching, not AI extraction. Suggestions are unsaved until approved. Ambiguous first names and duplicate full names are skipped; edit those profiles directly by source ID. Matching a name does not establish that you met.",
  };
}
