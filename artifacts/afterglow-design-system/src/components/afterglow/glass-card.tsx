import * as React from "react";
import { cn } from "../../lib/utils";
import type { Tone } from "./tone";

export interface GlassCardProps extends React.HTMLAttributes<HTMLElement> {
  compact?: boolean;
  /** Solid full-value color block instead of glass (text becomes on-bright) */
  tone?: Tone;
  /** With tone: radius-xl corners, for hero blocks */
  slab?: boolean;
  as?: "div" | "section" | "article" | "li" | "aside" | "header" | "footer";
}

/** Source Afterglow GlassCard (`ag-glass`, `ag-block`). */
export const GlassCard = React.forwardRef<HTMLElement, GlassCardProps>(function GlassCard(
  { compact, tone, slab, as = "div", className, children, ...rest },
  ref,
) {
  const Comp = as as React.ElementType;
  return (
    <Comp
      ref={ref}
      className={cn(
        "ag-glass",
        compact && "ag-glass--compact",
        tone && `ag-block ag-block--${tone}`,
        tone && slab && "ag-block--slab",
        className,
      )}
      {...rest}
    >
      {children}
    </Comp>
  );
});
