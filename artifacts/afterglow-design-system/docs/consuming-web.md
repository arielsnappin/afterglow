# Consuming Afterglow Design System in web apps

Read `artifacts/afterglow-design-system/docs/AGENTS.md` first. This guide covers
React/Vite and other shadcn/Tailwind web consumers. If the app already contains
a local theme or component library, also read
`artifacts/afterglow-design-system/docs/migrating-web.md` before writing UI.

## Theme

Import this package's theme once from the app's main CSS:

```css
@import "@workspace/afterglow-design-system/styles.css";
```

`styles.css` already imports Tailwind, its plugins, and this package's token
theme. It also registers this package's component sources. Do not add a separate
Tailwind import or a `node_modules` source path in a Tailwind v4 consumer.
Tailwind v3 consumers keep their existing `@tailwind` directives and add
`node_modules/@workspace/afterglow-design-system/src/components` to `content`.

The generated stylesheet loads Bricolage Grotesque, DM Sans and Instrument Serif itself (first-line Google Fonts import),
and provides `shadow-sm/md/lg` elevation, the `ease-standard` easing utility,
`--motion-duration-*` variables, and a reduced-motion guard. Toggle dark mode by
adding the `dark` class to `<html>` (for example with `next-themes`
`ThemeProvider attribute="class"`, which the Sonner `Toaster` reads).

Night out (dark) is the intended default. Prefer the source families in
`components/afterglow/*` (Button, RsvpPicker, GlassCard, EventCard, AvatarStack,
Sticker, TextField) and the `type-*`, `glass`, `bg-pop`, `text-on-bright`,
`text-pop-ink` utilities. Neon fills always take `text-on-bright`.

## Components and helpers

Import every provided primitive, `cn`, and toast API directly from this package:

```tsx
import { Button } from "@workspace/afterglow-design-system/components/ui/button";
import { cn } from "@workspace/afterglow-design-system/lib/utils";
import {
  toast,
  useToast,
} from "@workspace/afterglow-design-system/hooks/use-toast";
```

Use the package component whenever it provides the required family. Keep
product-specific compositions in the app, but compose them from package
primitives rather than recreating those primitives locally.

The packaged `Toaster` and toast hook share one in-memory store. Do not call a
local toast hook while rendering the packaged `Toaster`.

## Verify

After wiring the workspace dependency, import and render
`@workspace/afterglow-design-system/components/ui/button`. Run the app's typecheck
and dev server. The import must resolve and the Button must use this package's
theme before broader UI work begins.

## Ongoing rules

- Keep one source of theme variables.
- Import package-provided primitives and helpers from the package path.
- Add reusable product-agnostic components to this package first.
- For a non-shadcn app, use the tokens as the source of truth and adapt existing
  components to the token CSS variables without copying token values.
