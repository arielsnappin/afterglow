# GlassCard

A container in two modes: a solid full-value color block (`tone`), the cover palette at work, or a frosted glass panel (the default) for supporting content.

- **Color block:** pass `tone` (`pop`, `zap`, `sun`, `sky` or `grape`) for a flat neon fill with `on-bright` text, no blur and no shadow. Add `slab` for `radius-xl` corners on the hero block. Make one block clearly the biggest (usually `pop`) and size the others smaller, like the cover.
- **Glass:** `glass` fill, `blur-glass`, a `line` border and `shadow-card`. Default padding is `space-6` with `radius-lg`; `compact` switches to `space-4` with `radius-md`.
- `h3` and `p` children pick up title and body styles automatically.
- Use `as` to render a semantic element (`section`, `article`, `li`).
- Don't nest glass inside glass more than once. For the inner layer, use `glass-strong` or `bg-raised`.
