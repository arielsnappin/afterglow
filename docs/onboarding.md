# Getting started in Afterglow

The product navigation is **Home → Follow-ups → People → Events → Integrations
→ Profile**. People is the relationship table; Events keeps its card summaries.

## Tour behavior

- A fresh browser opens the four-step tour automatically on its first load of
  Home. Deep links do not interrupt an editing screen.
- **Get started**, **Resume tour**, or **Quick tour** in navigation opens it
  again. The compact/mobile launcher has the same accessible label.
- Tour progress is local to the browser. Completing it means the walkthrough
  was viewed, not that a profile was saved or an integration was connected.
- Profile means goals and topics, not an authenticated account. An explicit
  **Save and continue** writes to the existing browser-scoped demo workspace.
- A typed topic is included on save even when Add was not clicked. Invalid
  goals/topic counts/topic lengths are rejected rather than silently trimmed.
- Closing the dialog keeps edited profile fields in memory for that session.
  Discarding them asks for confirmation; reloading or leaving with unsaved
  edits requests the browser's standard warning.
- Saving blocks closing and step changes until the request settles. Failures
  retain the draft for retry. No tour action imports or resets a workspace.

## Visual guidance and motion

The tour uses Afterglow's shared GlassCard, Sticker and AvatarStack families,
alongside its existing form and dialog components. Each step has a themed
intro and short staggered entrances using the system's motion tokens.
Reduced-motion preferences disable these entrance animations.

The attendance illustration and sample follow-up are explicitly fictional;
neither reads as an imported record or a sent message. Profile inputs are not
wrapped in animated replacements, so typing does not remount them. The header
and footer do not shrink; longer step content scrolls between them.

## Integrations

`/integrations` is canonical; `/imports` remains an alias for existing links.
Luma simulation and bundled synthetic CSV retain their preview/confirmation
flow. Google Calendar, Eventbrite and Pinterest are unavailable future entries.
There are no new provider connections, API keys, authenticated accounts, or
message-sending capabilities in this change.

## People table

Search covers name, role, company, bio, notes and interests. Met and follow-up
status filters can be combined; sorting offers priority, name, or due date.
Registration-only records are not labeled confirmed attendees. The named person
button opens the existing editor without adding a second editing workflow.
The table scrolls horizontally within its container on narrow screens.

## Checks

`pnpm --filter @workspace/afterglow test` covers navigation order/aliases,
provider availability, table structure and attendance labels, corrupt or blocked
tour storage, and profile-input validation, alongside existing experience checks.
The app typecheck passes. A focused browser pass verified draft preservation,
discard cancellation, save including an unadded topic, reload persistence,
tour completion, Eventbrite's disabled state, and reachable mobile controls.
It did not exercise injected network failures or save/close races.
The focus-return issue found in that pass was corrected and retested after
Escape on desktop and mobile, plus the mobile Close button.

The visual-refinement browser pass checked desktop Night out and mobile Day
party, stable input elements while typing, retained unsaved goal/pending topic,
explicit discard, reachable scrolling content/footer, and Escape focus return.
No profile data was saved during that pass. Reduced-motion rules were verified
in the source and generated stylesheet, but real CSS media emulation was not
available in the browser harness; a JavaScript matchMedia override alone does
not validate CSS media queries.
