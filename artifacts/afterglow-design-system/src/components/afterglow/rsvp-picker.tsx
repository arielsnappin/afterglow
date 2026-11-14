import * as React from "react";
import { cn } from "../../lib/utils";

export interface RsvpOption {
  id: string;
  emoji: string;
  label: string;
}

export interface RsvpPickerProps {
  /** Defaults to Going / Maybe / Can't go. ids 'going' | 'maybe' | 'cant' get their tone colors. */
  options?: RsvpOption[];
  value?: string | null;
  defaultValue?: string | null;
  onChange?: (id: string) => void;
  /** Accessible group label, default "RSVP" */
  label?: string;
  disabled?: boolean;
  className?: string;
}

export const RSVP_DEFAULT: RsvpOption[] = [
  { id: "going", emoji: "🎉", label: "Going" },
  { id: "maybe", emoji: "🤔", label: "Maybe" },
  { id: "cant", emoji: "😢", label: "Can't go" },
];

/** Source Afterglow RsvpPicker (`ag-rsvp`): a radiogroup with roving focus and arrow-key selection. */
export function RsvpPicker({ options = RSVP_DEFAULT, value, defaultValue = null, onChange, label = "RSVP", disabled, className }: RsvpPickerProps) {
  const [inner, setInner] = React.useState<string | null>(defaultValue);
  const current = value !== undefined ? value : inner;
  const refs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const pick = (id: string) => {
    if (disabled) return;
    setInner(id);
    onChange?.(id);
  };
  const activeIndex = Math.max(0, options.findIndex((o) => o.id === current));
  const onKeyDown = (e: React.KeyboardEvent, i: number) => {
    const delta = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    const next = (i + delta + options.length) % options.length;
    refs.current[next]?.focus();
    pick(options[next].id);
  };
  return (
    <div className={cn("ag-rsvp", className)} role="radiogroup" aria-label={label} aria-disabled={disabled || undefined}>
      {options.map((o, i) => {
        const on = current === o.id;
        return (
          <button
            key={o.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={on}
            tabIndex={i === activeIndex ? 0 : -1}
            disabled={disabled}
            className={cn("ag-rsvp__opt", `ag-rsvp__opt--${o.id}`, on && "is-on", disabled && "cursor-not-allowed opacity-45")}
            onClick={() => pick(o.id)}
            onKeyDown={(e) => onKeyDown(e, i)}
          >
            <span className="ag-rsvp__emoji" aria-hidden="true">
              {o.emoji}
            </span>
            <span>{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
