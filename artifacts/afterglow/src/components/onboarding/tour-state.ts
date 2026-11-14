/** Local-only record that the tour was viewed. It never claims a profile or integration action was done. */
export type TourStatus = "new" | "dismissed" | "completed";
export interface TourState { status: TourStatus; step: number }

const KEY = "afterglow:onboarding-tour";
export const TOUR_STEPS = 4;
export const MAX_GOAL = 500;
export const MAX_TOPICS = 20;
export const MAX_TOPIC_LEN = 80;

export function loadTour(): TourState {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { status: "new", step: 0 };
    const v = JSON.parse(raw) as Partial<TourState>;
    const status: TourStatus = v.status === "dismissed" || v.status === "completed" ? v.status : "new";
    const step = typeof v.step === "number" && v.step >= 0 && v.step < TOUR_STEPS ? Math.floor(v.step) : 0;
    return { status, step };
  } catch {
    return { status: "new", step: 0 };
  }
}

export function saveTour(s: TourState) {
  try { window.localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* storage unavailable: tour still works for this session */ }
}

/** Trim, drop blanks and case-insensitive duplicates (first spelling wins). Never truncates or caps; validate separately. */
export function cleanInterests(list: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of list) {
    const v = raw.trim();
    if (!v || seen.has(v.toLowerCase())) continue;
    seen.add(v.toLowerCase());
    out.push(v);
  }
  return out;
}

export interface ProfileDraft { goal: string; interests: string[]; entry: string }
export type ProfileCheck =
  | { ok: true; goal: string; interests: string[] }
  | { ok: false; goalError?: string; topicError?: string };

/** Validate the draft including any typed-but-not-added topic. Nothing is silently dropped. */
export function validateProfile(d: ProfileDraft): ProfileCheck {
  const goal = d.goal.trim();
  const goalError = !goal ? "Add a sentence so suggestions have something to match." : goal.length > MAX_GOAL ? `Keep it under ${MAX_GOAL} characters.` : undefined;
  const interests = cleanInterests([...d.interests, d.entry]);
  const long = interests.find((i) => i.length > MAX_TOPIC_LEN);
  const topicError = long ? `"${long.slice(0, 24)}..." is longer than ${MAX_TOPIC_LEN} characters. Shorten it before saving.`
    : interests.length > MAX_TOPICS ? `That makes ${interests.length} topics. Remove some to stay at ${MAX_TOPICS} or fewer.` : undefined;
  if (goalError || topicError) return { ok: false, goalError, topicError };
  return { ok: true, goal, interests };
}

export function draftDiffers(d: ProfileDraft | null, saved: { goal: string; interests: string[] } | undefined) {
  if (!d || !saved) return false;
  return d.goal !== saved.goal || d.interests.join("\u0000") !== saved.interests.join("\u0000") || !!d.entry.trim();
}
