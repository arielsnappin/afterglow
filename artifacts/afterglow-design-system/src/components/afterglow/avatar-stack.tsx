import * as React from "react";
import { cn } from "../../lib/utils";
import { TONES, initials, type Tone } from "./tone";

export interface AvatarPerson {
  name: string;
  tone?: Tone;
}

export interface AvatarStackProps {
  people: AvatarPerson[];
  /** How many avatars before "+N"; default 4 */
  max?: number;
  /** Real total when people is a sample */
  total?: number;
  size?: "sm" | "md";
  caption?: React.ReactNode;
  className?: string;
}

/** Source Afterglow AvatarStack (`ag-avs`). */
export function AvatarStack({ people, max = 4, total, size = "md", caption, className }: AvatarStackProps) {
  const shown = people.slice(0, max);
  const extra = (total != null ? total : people.length) - shown.length;
  const names = people.map((p) => p.name).join(", ");
  return (
    <div className={cn("ag-avs", `ag-avs--${size}`, className)} role="group" aria-label={caption ? undefined : names || "No one yet"}>
      {shown.map((p, i) => (
        <span key={`${p.name}-${i}`} className={cn("ag-av", `ag-av--${p.tone || TONES[i % TONES.length]}`)} title={p.name} aria-hidden="true">
          {initials(p.name)}
        </span>
      ))}
      {extra > 0 ? (
        <span className="ag-av ag-av--more" aria-hidden="true">
          +{extra}
        </span>
      ) : null}
      {caption ? <span className="ag-avs__cap">{caption}</span> : null}
    </div>
  );
}

/** Single round initials avatar on a neon fill (one-person AvatarStack). */
export function Avatar({ name, tone = "pop", size = "md", className }: { name: string; tone?: Tone; size?: "sm" | "md"; className?: string }) {
  return (
    <span className={cn("ag-avs", `ag-avs--${size}`, className)}>
      <span className={cn("ag-av", `ag-av--${tone}`)} role="img" aria-label={name}>
        {initials(name)}
      </span>
    </span>
  );
}
