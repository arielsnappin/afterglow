import * as React from "react";
import { cn } from "../../lib/utils";
import { AvatarStack, type AvatarPerson } from "./avatar-stack";
import { Sticker } from "./sticker";
import type { Tone } from "./tone";

export interface EventCardProps {
  title: React.ReactNode;
  date?: string;
  time?: string;
  location?: string;
  host?: string;
  /** Poster fill; default pop */
  tone?: Tone;
  /** Big emoji on the poster (decorative) */
  emoji?: string;
  sticker?: React.ReactNode;
  stickerTone?: Tone;
  going?: AvatarPerson[];
  goingCount?: number;
  /** Override the "N going" caption (e.g. "4 people you know"). */
  goingCaption?: React.ReactNode;
  /** Heading level for the title; default h3 */
  headingLevel?: "h2" | "h3" | "h4";
  /** Actions row (e.g. Buttons) */
  children?: React.ReactNode;
  className?: string;
}

/** Source Afterglow EventCard (`ag-event`): poster, title, meta, host, who's going, actions. */
export function EventCard({
  title,
  date,
  time,
  location,
  host,
  tone = "pop",
  emoji,
  sticker,
  stickerTone,
  going = [],
  goingCount,
  goingCaption,
  headingLevel = "h3",
  children,
  className,
}: EventCardProps) {
  const H = headingLevel;
  return (
    <article className={cn("ag-event", className)}>
      <div className={cn("ag-event__poster", `ag-event__poster--${tone}`)}>
        {emoji ? (
          <span className="ag-event__emoji" aria-hidden="true">
            {emoji}
          </span>
        ) : null}
        {sticker ? (
          <Sticker tone={stickerTone || (tone === "zap" ? "sun" : "zap")} tilt={6}>
            {sticker}
          </Sticker>
        ) : null}
      </div>
      <div className="ag-event__body">
        <H className="ag-event__title">{title}</H>
        {date || time ? <p className="ag-event__meta">{[date, time].filter(Boolean).join(" · ")}</p> : null}
        {location ? <p className="ag-event__meta ag-event__meta--muted">{location}</p> : null}
        {host ? (
          <p className="ag-event__host">
            Hosted by <strong>{host}</strong>
          </p>
        ) : null}
        {going.length ? (
          <AvatarStack people={going} total={goingCount} max={4} size="sm" caption={goingCaption ?? `${goingCount || going.length} going`} />
        ) : null}
        {children ? <div className="ag-event__actions">{children}</div> : null}
      </div>
    </article>
  );
}
