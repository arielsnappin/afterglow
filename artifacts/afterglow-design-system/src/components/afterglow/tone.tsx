/** Neon fills from the uploaded Afterglow system. Fill-only: text on them is always `on-bright`. */
export type Tone = "pop" | "zap" | "sun" | "sky" | "grape";

/** Cycle order used by AvatarStack (source TONES). */
export const TONES: readonly Tone[] = ["pop", "zap", "sun", "sky", "grape"] as const;

/** Stable tone for a string (e.g. a person id) so a person keeps one color everywhere. */
export function toneFor(key: string): Tone {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return TONES[h % TONES.length];
}

/** Source `initials()` helper: first letter of up to two words, uppercased. */
export function initials(name: string | null | undefined): string {
  return String(name || "?")
    .trim()
    .split(/\s+/)
    .map((s) => s.charAt(0))
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
