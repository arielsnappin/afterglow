# Luma-inspired synthetic import demo

## Walkthrough

Run the existing Afterglow web and API workflows. Open **Connections** (the existing `/imports` URL).

1. Choose **Try demo connection** on Luma to simulate a provider connection, or download the synthetic sample CSV and choose **Import sample CSV**.
2. Preview the six events, 24 people and 60 guest records. Server validation reports reading events, matching people by stable IDs, and checking ticket attendance evidence together. A labeled paced recap displays the already-completed validation milestones; it is not live server progress. Reduced-motion preferences skip the pacing.
3. Confirm to commit. The original browser workspace is temporarily replaced and retained privately for reset. Cancel leaves it unchanged. Repeat imports report a duplicate and do not overwrite edits.
4. The controller appears across the existing app. Start at **November 2, 2026**, before any attendance. Advance explicitly through eight chapters, ending **November 28**. Events run November 3–27.
5. After the first event, choose **Review event**. Expand registration evidence to compare approved registrations, missing check-ins and waitlisted guests. Only checked-in guests appear under **People you attended with**. Self-attendance is an explicit demo assumption.
6. Optionally load the fictional debrief prompt into the unsaved editor, edit it, save, and review name-matched notes individually. Adding a note does **not** mark a person met or contacted. Duplicate full names are skipped: edit the intended source ID directly.
7. Set notes, meeting status, follow-up status, a due date, or a draft yourself. Set Maya Rowan's due date to November 5 to see the label and counts change at chapter 2. Advancement preserves these edits.
8. Reload: the browser cookie retains the workspace and chapter. Reset asks for confirmation, clears imported demo changes and restores the exact pre-import snapshot (including its earlier edits). It affects only this browser's synthetic workspace. Clearing cookies starts a separate workspace.

No API keys, Luma subscription, sign-in, external connection, real messages, AI processing or calendar access are involved.

## Sources and limits

Planning consulted Luma's official [Getting Started](https://docs.lu.ma/reference/getting-started-with-your-api) and [public OpenAPI schema](https://public-api.luma.com/openapi.json). Calendar-scoped API keys and Luma Plus are relevant to a possible live integration, **not this demo**. The documented reads were `/v1/calendars/events/list`, `/v1/events/get` and `/v1/events/guests/list`, with `entries`, `has_more` and `next_cursor` pagination.

This flattened schema is **Luma-inspired synthetic CSV**, not a claim about official guest export headers. No exact guest CSV export schema was verified.

| Columns | Meaning |
| --- | --- |
| `event_id`, `calendar_id`, `event_name` | Flattened synthetic event identity/name (inspired by provider `id`, `calendar_id`, `name`) |
| `start_at`, `end_at`, `timezone` | Event instants and IANA zone |
| `url`, `geo_address_json` | Fictional example.com event URL and quoted JSON address |
| `guest_id`, `user_id`, `user_name`, `user_email` | Stable guest and user identity; fictional reserved example-domain email |
| `approval_status`, `registered_at` | Registration facts: approved, declined or waitlisted |
| `ticket_id`, `ticket_checked_in_at` | Flattened ticket identity/check-in evidence inspired by `event_tickets[].checked_in_at`, **not** a guaranteed top-level guest check-in |
| `demo_scenario`, `demo_self_checked_in_at` | Explicit demo extensions, **not provider fields**; scenario version and assumed self-attendance |

The endpoint accepts **only the bundled scenario's complete, unchanged row content**. CSV quoting, BOM, LF/CRLF and row order may vary. It supports quoted commas, escaped quotes and multiline cells, but exact sample values and source IDs remain mandatory. Downloaded bytes are not retained as uploaded files; only the normalized scenario is persisted. The browser and API enforce a 48,000-byte CSV limit within the API's 64 KiB JSON request limit. JSON string overhead is tested.

The demo marker is a UX guard, **not authentication or a privacy guarantee**. A rejected file has still reached the server if submitted. Do not submit personal data, credentials, real exports, or private notes. Browser-scoped identifiers are not production ownership controls.

## Evidence and simulated time

Registration never proves attendance; a check-in combined with demo self-attendance establishes shared attendance only, not a meeting. Future check-in timestamps, scenario debrief prompts and evidence are withheld until the chapter date. All event kinds, due labels, summaries, ordering and draft context follow that date.

Repeated shared attendance is factual context within a **demo-defined 28-day window**. This is not an approved production recommendation/scoring policy. Follow-up suggestions require confirmed shared attendance; registration-only people remain visible in People and approved upcoming guest lists, not follow-up priorities. No chapters invent private notes, meetings, reviewed suggestions or contacted/replied states as user actions.

## Verification

With both workflows running:

```sh
pnpm --filter @workspace/api-spec run codegen
pnpm run typecheck
pnpm --filter @workspace/api-server test
pnpm --filter @workspace/afterglow test
```

Tests cover parsing/limits, validation, identity collisions, normalization equivalence, evidence timing, chapter boundaries, manual-edit preservation, clock-based summaries, database rollback, concurrent repeat imports/advancement, cookie isolation, the actual HTTP contracts, retry after failure, and reset confirmation/snapshot restoration. Database tests create their own random demo IDs and remove those records afterward. HTTP tests use the shared local proxy, never production.

The web regression suite bundles isolated synthetic API fixtures and uses server rendering and pure-function checks. It covers grouped follow-up states, saved/unsaved preference ordering, recorded-interest shortcuts, attendance eligibility, summary labels, accessible expanded/collapsed navigation, and preservation of edit/import control wiring. It does not replace browser checks of clipboard permissions, focus, responsive layout, or persistence through the actual UI.
