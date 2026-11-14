# Button

Pill-shaped actions that bounce when pressed. Use `primary` (pop pink with glow) at most once per view, for the thing the screen is for.

- **Variants:** `primary` for the main action, `secondary` (glass) for alternatives, `zap` (lime) for celebratory secondary actions like share or invite, `sun` / `sky` / `grape` for color-coded secondary actions (calendar, message, plus-one), `ghost` for dismissals. Show at most two neon buttons side by side.
- **Sizes:** `sm` (36px) inside cards, `md` (48px) by default, `lg` (56px) for the hero CTA at the bottom of a screen. Use `block` for full width on mobile.
- **Copy:** lead with a verb, use sentence case, and prefer first person ("I'm going", "Count me in"). An optional `icon` emoji goes before the label. Never ship an emoji-only button.
- **The page provides:** the click handler and disabled state. Text on neon is always `on-bright`.
