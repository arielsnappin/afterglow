# Verification

Run from the workspace root:

```sh
pnpm --filter @workspace/afterglow-design-system run verify
pnpm run typecheck
pnpm --filter @workspace/afterglow-design-system run test:regression
```

`verify` regenerates outputs and checks both complete standard palettes,
the exact retained uploaded token source, matching role names, valid hex/RGBA
values, alpha-composited text contrast of at least 4.5:1 on paired surfaces,
focus contrast of at least 3:1, dark text on all five neon fills, font roles,
source radius/spacing, no unresolved placeholders, and story registration.
The uploaded translucent line borders are preserved as supplied; they are
not represented as passing a 3:1 input-boundary contrast test.

Compatibility modules each have a lazy family story; Toaster is a mount helper
in the toast family. All seven uploaded component families have separate
registered pages sharing a lazy source-demo module.

## Automated browser interactions

Start the existing **artifacts/afterglow-design-system: web** workflow first.
No API server, product app, account, or real data is needed. Then run
`test:regression` above: it runs the existing token/schema/contrast checks
followed by the Playwright Chromium suite. For browser-only debugging:

```sh
pnpm --filter @workspace/afterglow-design-system run test:interactions
pnpm --filter @workspace/afterglow-design-system run test:interactions --grep "select supports"
```

The suite uses the managed preview through the shared local proxy at
`http://127.0.0.1/afterglow-design-system/`. `DS_TEST_BASE_URL` can override the
local proxy origin/port but must retain that exact artifact path and a loopback
host. It rejects public/live URLs. Outside Replit, serve the guide with the same
base path behind a local reverse proxy before running the command. It does not
start a duplicate development server.

Chromium is the only required browser. Replit's bundled Chromium is detected
automatically; elsewhere install it once with:

```sh
pnpm --filter @workspace/afterglow-design-system exec playwright install chromium
```

Alternatively set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to an installed Chromium.
The runner fails normally if the browser or guide is unavailable; it never
silently skips tests. CI should start the guide/proxy, install Chromium, then
run `test:regression`; retries are disabled and focused tests are forbidden.

Coverage in `tests/`:

- Real Tab/Shift+Tab/Enter navigation, skip link, search, empty results,
  deep links, reload, and back/forward history.
- Dialog and all four sheet edges: initial focus, both wrap boundaries,
  focus containment, Escape and explicit-close dismissal, and opener restoration.
- Select keyboard changes and committed value, disabled option skipping,
  Escape cancellation, reopening selection, and trigger restoration.
- Toggle/switch pressed/checked states and disabled tab stops; controlled
  source RSVP arrow selection, wraparound, and roving focus.
- Isolated guide theme persistence across reloads in both modes, fresh default,
  query default, saved-preference precedence, and unchanged product/generic keys.
- Actual reduced-motion media emulation and computed spinner, bounce,
  dialog/sheet animation and transition behavior.
- 320px layouts in both themes: mobile navigation closure/focus restoration, select popup bounds,
  overlay bounds and horizontal overflow, reachable footer actions, and scrolling
  inside a content-heavy form at 480px height.

Each test uses fresh browser storage and fictional local style-guide stories.
The network guard blocks non-guide requests and all non-GET/HEAD requests
**before sending them**, and fails the test for attempted API/external data
access. Remote fonts are intentionally blocked without failure to remove CDN
dependencies. Uncaught browser errors also fail the test. No test visits the
product or loads live API data.

Failure screenshots, traces, and the HTML report go under
`generated-artifacts/design-system/` at the workspace root (ignored by Git and
deployment). To inspect the latest report:

```sh
pnpm --filter @workspace/afterglow-design-system exec playwright show-report ../../generated-artifacts/design-system/report
```

These are behavioral regression checks, not pixel snapshots, a complete browser
matrix, an assistive-technology audit, or accessibility certification.

## Adoption checks

The uploaded JSON and ZIP contain the same 20 files. Original source assets
are retained for traceability and the bundled global JavaScript is not run.
The live app consumes typed components directly from the shared package.
Source assets and theme choice supersede the previous quiet-lavender proposal.

Verification for adoption includes the workspace typecheck, source-fidelity
and contrast script, rendered desktop/mobile checks, plus a focused real-browser
person-notes save/reopen/restore journey following the input replacement.
This is not an exhaustive assistive-technology audit or accessibility
certification. Backend, shared API contracts, and Canvas are outside this
visual adoption.

The browser save/reopen/reload check passed and original demo notes were
restored. Day party and Night out were legible, and DM Sans/Bricolage fonts
were confirmed loaded. The mobile sheet scrolled to its save controls.
Two issues found during that pass were fixed: People grids now use explicit
zero-minimum tracks, and controlled person sheets explicitly restore focus
to their opening control. Mobile layout was recaptured after the fix; focus
restoration was confirmed from its implementation rather than rerunning the
full browser journey. Duplicate theme-toggle test identifiers were separated
between desktop and mobile controls.
