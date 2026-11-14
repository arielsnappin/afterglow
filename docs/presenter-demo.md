# Afterglow — Behind the glow

## Public page and local speaker companion

`generated-artifacts/afterglow-demo.html` is the public-audience standalone HTML.
It is **not** an embedded product page or an admin tool. The app's **Builder
notes** link below the theme toggle opens `/afterglow-demo.html` in a new tab.
The dev/build lifecycle regenerates the standalone public copy, and Vite
includes it in the app's published files on the next publish. Access follows
the deployment's visibility; adding the link does not make a private app public.

`presenter-notes/afterglow-two-minute.md` is the presenter-only companion:
252 spoken words across six contiguous segments totaling 120 seconds. Its
timed cues follow the public page: opening; attendance/workflow/builder notes;
design center; testing; metrics/next steps; share and track.

The entire presenter-notes folder is excluded from Git and deployment.
It is outside all public folders and is not an input to the HTML build.
The public page has no transcript, hidden notes, rehearsal controls, or note
download link. These exclusions do **not** restrict workspace collaborators'
filesystem access; never put secrets or personal attendee data in the notes.

## Rebuild and verify

```sh
node presentation/afterglow-demo/build.mjs
node presentation/afterglow-demo/verify.mjs
```

`--app` also writes the public copy used by the app. Its `predev` and `prebuild`
scripts call this automatically, so the link does not depend on an untracked
manual export surviving. The public copy is ignored by Git, not by deployment.

The build inlines browser-valid CSS from the authoritative design system and
the dated evidence snapshot. It rejects presenter controls and external
load-time resources. Fonts use the source system's fallback stacks; no font
CDN is contacted. No trackers or API requests are made on load.

For temporary visual inspection only, `--preview` additionally creates
`artifacts/mockup-sandbox/public/afterglow-presenter-preview.html`. That file
is ignored by Git/deployment and should be removed after checking. It is not
a new Canvas entry or product route.

## Interactions

- Section links jump directly to the story, builder notes, design, evidence,
  and sharing. Night out / Day party switches the page's theme.
- The workflow has five keyboard-navigable steps; samples do not import data.
- RSVP and TextField specimens are static HTML using source CSS, not React.
  Their changes are local to the page and never saved to the product.
- Copy link/invite reports success or failure and supports a clipboard fallback.
  Copying never marks a message sent or a link shared.
- The checklist is manual, stored only in this browser, and separate from app
  outcomes. Storage failure explicitly reports that changes are not saved.
  Clear checklist removes only this page's checklist. There is no analytics.

## Evidence and limits

The evidence JSON is a dated snapshot, not a live test runner or access check.
API/static checks retain their original run dates; interface checks and the
focused onboarding browser pass carry their own dates and limits. Counts
describe tests, never users. The project completion gate runs product and
design-system browser suites separately from the HTML checks; templates do
not have an LLM-quality evaluation.

Export checks cover script syntax, note separation, 120-second timing/word
count, unique anchors, exactly three proposed metrics, and script-level theme,
stepper keyboard/focus, copy success/failure, malformed or blocked storage,
and checklist-clear behavior using an offline DOM fixture. These are not
browser clipboard-permission tests or an accessibility audit.

Desktop opening/design-center and mobile sharing rendering were checked in the
temporary sandbox preview. The shared design system was unchanged. Completion
checks exposed an existing narrow product-header overflow and two outdated
Connections test locators from a newly merged suite; the header now wraps on
narrow screens and the locators use Integrations. No product routes were added.

The verified deployment was private at the snapshot date. Copying its URL does
not grant access or publish this HTML. Real accounts, permitted integrations
and data ownership must precede real personal data. Commercialization,
open-source and platform-pilot ideas are proposals, not existing partnerships.
