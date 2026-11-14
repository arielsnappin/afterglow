import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "../../lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** primary = pop pink with glow (one per view); secondary = glass; zap/sun/sky/grape = neon fills; ghost = text only */
  variant?: "primary" | "secondary" | "zap" | "sun" | "sky" | "grape" | "ghost";
  size?: "sm" | "md" | "lg";
  /** Full width */
  block?: boolean;
  /** Leading emoji or icon node (decorative) */
  icon?: React.ReactNode;
  /** Shows a busy state: disabled, aria-busy, label kept so width is stable. */
  loading?: boolean;
  /** Render the child element (e.g. a router Link) with button styles. */
  asChild?: boolean;
}

/** Source Afterglow pill Button (`ag-btn`). */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", block, icon, loading, asChild, className, children, disabled, type, ...rest },
  ref,
) {
  const cls = cn("ag-btn", `ag-btn--${variant}`, size !== "md" && `ag-btn--${size}`, block && "ag-btn--block", className);
  if (asChild) {
    return (
      <Slot ref={ref} className={cls} {...rest}>
        {children}
      </Slot>
    );
  }
  return (
    <button
      ref={ref}
      type={type ?? "button"}
      className={cls}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {icon ? (
        <span className="ag-btn__icon" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      <span>{children}</span>
    </button>
  );
});
