# Afterglow

Keep event connections warm. Afterglow brings event context, people, conversation notes, and follow-up actions into one workspace.

- **App:** https://afterglow-cornell-tech.replit.app
- **Builder notes:** https://afterglow-cornell-tech.replit.app/afterglow-demo.html

The Replit deployment's access settings control who can open these links. A public GitHub repository does not automatically make the running app public.

## What this prototype does

- Browse events and a people-focused CRM.
- Distinguish registration, attendance, and people actually met.
- Record context, prioritize connections, and manage follow-up drafts.
- Walk through profile setup, integrations, and follow-ups with an onboarding tour.
- Try a synthetic import workflow without connecting personal accounts.
- Explore the design decisions and evaluation evidence in standalone Builder notes.

**Demo boundaries:** The prototype uses synthetic examples and browser-scoped demo workspaces. Its demo cookie is not production user authentication. Live Luma, LinkedIn, and other provider integrations are not implemented; follow-up drafts are not automatically sent. Do not upload confidential attendee data.

## Project structure

| Directory | Purpose |
| --- | --- |
| `artifacts/afterglow` | React/Vite app |
| `artifacts/api-server` | Express API |
| `artifacts/afterglow-design-system` | Shared components, tokens, and design-system documentation |
| `artifacts/mockup-sandbox` | Design exploration workspace |
| `lib` | Database schema, API contract, and generated clients |
| `presentation/afterglow-demo` | Standalone public Builder notes source |

## Development

This is a pnpm workspace, configured for Node.js 24 and Replit's artifact routing.

1. Import the repository into Replit and run `pnpm install`.
2. Provision a PostgreSQL database and configure `DATABASE_URL` through Secrets, never in source code.
3. On your own new development database, apply the schema with `pnpm --filter @workspace/db push`. Review any proposed database changes before accepting them.
4. Start the app and API artifact workflows. Their configuration supplies `PORT` and `BASE_PATH`; Replit routes the frontend and `/api` on the same origin.

Outside Replit, configure equivalent same-origin routing for `/api` to the Express server, and provide each service's required port and frontend base path. This repository does not include a one-command standalone hosting setup.

### Checks

```sh
pnpm --filter @workspace/afterglow test
pnpm --filter @workspace/afterglow typecheck
pnpm --filter @workspace/api-server test
```

### Frontend build

```sh
PORT=24338 BASE_PATH=/ pnpm --filter @workspace/afterglow build
```

The prebuild step generates `afterglow-demo.html` from its source and copies it into the frontend output alongside `index.html`. Deploy the API service as well; hosting only the frontend is not enough for the full application.

## Publication boundaries

This repository starts with a clean source snapshot, without the original workspace's Git history, database contents, secrets, uploaded personal files, agent memory, presenter-only scripts, or generated test outputs.

Presenter notes are intentionally not included. The private presenter verification command is therefore not a portable repository test. The public Builder notes build does not require those notes.

Keep credentials in your hosting provider's secret store. Respect the existing attribution and licensing notices for dependencies and provider assets.
