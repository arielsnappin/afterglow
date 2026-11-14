# Afterglow regression checks

Run from the workspace root:

```sh
# Fast isolated SSR and pure-helper checks (no servers or database).
pnpm --filter @workspace/afterglow test

# Complete release check: the above plus the real-browser synthetic workspace.
pnpm --filter @workspace/afterglow test:regression

# Browser-only run, or a focused investigation.
pnpm --filter @workspace/afterglow test:browser
pnpm --filter @workspace/afterglow test:browser --project=dark --grep "draft, notes"
```

The complete command is registered as the `afterglow-regression` validation.
Before running it, start the existing **artifacts/api-server: API Server** and
**artifacts/afterglow: web** workflows. They supply the service ports, base paths,
and development database configuration. The design-system and Canvas workflows
are not required. This suite uses the real development API and its existing
synthetic-workspace storage, not the SSR API fixture.

## Browser setup and isolation

Chromium uses `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`, the Replit system Chromium
at `/repl/tools/bin/chromium`, or Playwright's installed browser, in that order.
On another development machine with no Chromium installed, run:

```sh
pnpm --filter @workspace/afterglow exec playwright install chromium
```

The default target is the managed local preview proxy at `http://127.0.0.1/`.
`AFTERGLOW_TEST_BASE_URL` supports a different **loopback** origin/port with the
same root path for CI reverse proxies. Published URLs, credentials, query strings,
and non-root paths are rejected before running. Both app and `/api` must be
served through that proxy. These are browser tests of the application, not
tests of the API port alone.

Each test gets a fresh browser context, random synthetic `afterglow_demo`
cookie scoped to `/api`, and a separate backend workspace. The cookie is set
before any page loads, avoiding competing first-load workspace/summary cookies.
No saved login/storage state, external credentials, or real files are used.
Setup uses the existing provider-synthetic import and advances to chapter 1
so attendance is confirmed. All edits being tested go through the actual UI.
The pre-import preferences deliberately differ from defaults so exact reset
snapshot comparisons cannot pass by merely restoring the seed.

The network guard blocks off-origin traffic, uploads, and API operations outside
the narrow synthetic allowlist. Remote fonts are blocked intentionally; the
suite does not depend on a CDN. Uncaught browser exceptions, unexpected API
failures, and forbidden requests fail tests. The shared test request helper
also checks the allowlist, cookie ownership, redirects and response status.
Teardown resets only that test's workspace, including on failure. Reset leaves
the isolated synthetic workspace row in the development database; it does not
delete or touch existing browser workspaces.

## Coverage

Every scenario runs in both Night out (dark) and Day party (light), with the
rendered theme asserted. The suite checks:

- Saved drafts, multiline notes, promises, next steps and dates on close/reopen
  and reload, plus explicitly clearing them and reloading again.
- Actual clipboard contents from an unsaved draft, no mutation request, no
  accidental save or status change, and unchanged state after reload.
- Meeting-flag changes clearing a stale draft while retaining notes.
- Unsaved preference previews not persisting, save propagation to the current
  ranking, Home and Follow-ups through client-side navigation, then reload.
- Suggested/Saved remaining warm, Contacted moving to Waiting, Replied staying
  in All only, and registrations being excluded from warm outreach.
- Status controls reached with real Tab presses, their independent visible
  focus ring, Radix option focus between arrow keys, and trigger focus after
  committing a status. No fixed sleeps or retries hide focus failures.
- Profile interest-editor/explainer and event debrief/attendee panels at 320,
  390 and 768 pixels, visible usable controls and no horizontal overflow.
- UI chapter advancement through the final chapter, simulated-date/due-label
  updates, preserved edits/status through reload, and a disabled final advance.
- Reset cancellation preserving every field, and confirmation restoring the
  **entire captured pre-import snapshot**, still restored after reload.

These are deterministic behavioral checks in Chromium, not pixel snapshots,
a complete browser matrix, or an accessibility certification. The fast SSR
tests remain separate so browser dependencies do not slow local helper checks.

## Failures

No retries are configured. Screenshots, traces, and the HTML report are written
under `generated-artifacts/afterglow/`, ignored by Git and deployment:

```sh
pnpm --filter @workspace/afterglow exec playwright show-report ../../generated-artifacts/afterglow/report
```

Wait for sheet exit and actual option focus rather than adding arbitrary
timeouts when extending the suite. Keep new data synthetic and retain the
cookie/network safety boundaries.
