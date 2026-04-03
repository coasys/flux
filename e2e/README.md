# Flux E2E Tests (SPARQL Backend)

End-to-end tests for Flux running against an AD4M executor with SPARQL/Oxigraph backend.

## Prerequisites

- AD4M executor running locally on port 12000
- Agent already initialized
- Executor stdout piped to `/tmp/ad4m-e2e-stdout.log` (for auth code extraction)

## Running

```bash
# Install deps (once)
pnpm install
pnpm exec playwright install chromium

# Run tests against deploy preview
pnpm test:e2e

# Run with headed browser (for debugging)
pnpm exec playwright test --config e2e/playwright.config.ts --headed

# Run a single test
pnpm exec playwright test --config e2e/playwright.config.ts -g "connect to local"
```

## Environment Variables

- `AD4M_STDOUT_LOG` — path to executor stdout log (default: `/tmp/ad4m-e2e-stdout.log`)

## What the tests verify

1. **Auth flow** — Connect to local AD4M node via ad4m-connect, enter 6-digit code
2. **User creation** — Create a profile with username on the SPARQL backend
3. **Profile display** — Verify username appears after creation
4. **Community creation** — Create a neighbourhood (tests SPARQL social-context)
5. **Messaging** — Send and verify a message in a channel

## Notes

- Tests use `test.describe.serial` — they depend on each other
- Generous timeouts account for language cold starts and neighbourhood publishing
- These are **local integration tests** — not meant for CI without an executor
- Flux uses shadow DOM web components (`j-button` etc.) — Playwright pierces these natively
