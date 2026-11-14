import * as React from "react";
import { cn } from "../../lib/utils";
import type { Tone } from "./tone";

export interface StickerProps {
  tone?: Tone;
  /** Rotation in degrees; default -4 */
  tilt?: number;
  children?: React.ReactNode;
  className?: string;
}

/** Source Afterglow Sticker (`ag-sticker`): one to three words of status or hype. */
export function Sticker({ tone = "zap", tilt = -4, children, className }: StickerProps) {
  return (
    <span className={cn("ag-sticker", `ag-sticker--${tone}`, className)} style={{ transform: `rotate(${tilt}deg)` }}>
      {children}
    </span>
  );
}
