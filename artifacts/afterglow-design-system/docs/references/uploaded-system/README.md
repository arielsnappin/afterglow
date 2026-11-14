# Afterglow — design system

Afterglow is a loud, warm, social design language for apps where people show up for each other. It takes its cues from party-invite apps: dark glassy surfaces, neon accents, chunky display type, emoji used as punctuation, and motion that bounces. It should feel like a group chat that turned into a plan.

It's a base system, not tied to one product yet. Tokens and components are generic enough to sit under an event, community, or relationship-building app.

## Principles

1. **Dopamine first.** Saturated color is the point. Neutral surfaces only exist so the neon can stand out.
2. **Glass over flat.** Content floats on frosted panels over a glowing background. Depth comes from blur and glow, not grey borders.
3. **Make it a moment.** Every key action (RSVP, invite sent, connection made) gets a little celebration: a bounce, a sticker, an emoji.
4. **Human, not corporate.** Write like a friend texting. Sentence case, contractions, the occasional emoji.
5. **Readable, always.** It can be loud and still pass contrast. Neon is for fills; text on neon is always `on-bright`.

## Voice & content

- Short, casual, sentence case: "You're in 🎉", "Who's coming?", "Send the invite".
- Verbs on buttons, ideally first-person: "I'm going", "Count me in", "Share invite".
- Emoji are punctuation, not decoration: at most one per line, and never as the only label. Every emoji has a text label beside it.
- Use a flourish word (`flourish` style, Instrument Serif italic) for one or two words of personality inside a display line: "Rooftop szn, *obviously*."
- Don't: ALL CAPS paragraphs, corporate phrasing ("Please submit your response"), exclamation-mark pileups.

## Color

Two themes: **Night out** (`dark`, the default and first theme) and **Day party** (`light`).

**The cover is the palette.** The neons work best the way the cover shows them: big, solid, full-value blocks on a clean deep-ink ground, with nothing tinting or blurring them. Build screens the same way.

- **Ground:** solid `bg`. No glow by default. If a screen is mostly glass, `ag-root--aura` adds a faint `aura-1` / `aura-2` glow, but it never competes with the blocks.
- **Color blocks:** the hero of a screen is a solid neon block: a poster, a stat, a "you're in" moment, a featured person. `GlassCard tone="pop"` (add `slab` for `radius-xl`) renders one. Lead with `pop`, support with `zap` and `sun`, and use `sky` and `grape` as satellites, in the same weighting as the cover. Text on a block is `on-bright`.
- **Surfaces:** for everything around the blocks, use `glass` with `backdrop-filter: blur(var(--blur-glass))` and a 1px `line` border. Use `glass-strong` for hover states and stacked sheets. Fall back to `bg-raised` where blur is too costly (long scrolling lists, low-end Android).
- **Text:** `ink` for primary text and `ink-muted` for meta. Both pass 4.5:1 on bg and glass in both themes.
- **Neon:** `pop` (hot pink, the hero), `zap` (lime), `sun` (yellow), `sky` (cyan), `grape` (violet). These are **fill-only** colors. Text, icons, and sticker outlines on them use `on-bright`. Never put white on neon.
- **Pink as text:** use `pop-ink`, never `pop`.
- **Meaning:** `pop` marks the primary action. `zap` = Going / success, `sun` = Maybe, `danger` = errors only. Sky and grape are decorative (posters, avatars, stickers) and carry no state.
- One `pop` primary button per view. A screen can show the full five-color set as blocks, but one block (usually `pop`) should be clearly the biggest. Never use equal-sized color tiles in a row; that reads as a swatch table.

## Typography

- **Display:** Bricolage Grotesque 800 at tight tracking for event titles and screen headers (`display-xl`, `display-lg`, `title`).
- **Body:** DM Sans for all UI (`body-lg`, `body`, `label`, `caption`).
- **Accent:** Instrument Serif italic (`flourish`) for a word or two of flair inside display lines.
- All three are Google Fonts. `components/bundle.css` imports them. In your own app, load the same three families.

## Shape & spacing

- Anything tappable is a pill (`radius-pill`). Cards use `radius-lg`, posters use `radius-xl`. Nothing in the system has square corners.
- The spacing scale is on a 4px base. Screens get `space-6` side margins, cards get `space-6` padding, and sections are separated by `space-8`.

## Depth, glow & blur

- `shadow-card` floats glass and posters over the aura.
- `glow-pop` goes under the primary button only. `glow-zap` goes under a selected Going RSVP. If everything glows, nothing does.
- `blur-glass` (20px) is for panels, buttons, and nav. `blur-heavy` (40px) is for modal backdrops and blurred poster backgrounds.

## Motion

The token file has no motion family, so these values live in `bundle.css` as CSS variables:

- `--ag-ease-bounce: cubic-bezier(.34,1.56,.64,1)` for presses, selection, and stickers landing.
- `--ag-ease-out: cubic-bezier(.22,1,.36,1)` for sheets and fades.
- Durations: 120ms on press, 220ms on select, 360ms on enter.
- On press, buttons scale to .96. Selected RSVP options scale up to 1.04 and their emoji does a little wiggle.
- Respect `prefers-reduced-motion`: drop the scale and wiggle, keep the color change.

## Iconography

There's no icon set yet. Emoji do the expressive work. For utility icons (back, share, calendar, location), use a rounded 2px-stroke line set such as Lucide or Phosphor (Bold), drawn in `currentColor`.

## Components

React 18 components in `components/bundle.js`, exposed as `window.Afterglow`:

| Component | Use it for |
| --- | --- |
| `Button` | Pill actions: `primary` (pop), `secondary` (glass), `zap`, `sun`, `sky`, `grape`, `ghost` |
| `RsvpPicker` | Going / Maybe / Can't go selector; works for any 2–4 option emoji choice |
| `GlassCard` | Frosted container, or a solid neon color block with `tone` |
| `EventCard` | Poster-style card: colored poster, title, meta, host, who's going |
| `AvatarStack` | Overlapping initials avatars with a "+N" overflow and caption |
| `Sticker` | Tilted, outlined badge ("NEW", "Hosting", "🔥 Hot") |
| `TextField` | Glass input or textarea with label and hint |

Each component's README describes what it expects from the page. Wrap your app root in a container with `class="ag-root"` to get the ground color and base font. Add `ag-root--aura` for the optional glow.
