# CI Pipeline

The CI pipeline (`.github/workflows/ci.yml`) runs automatically on every **push** or **pull request** to `main` or `dev`.

## Jobs overview

```
build-shared ──┬── test-backend  ──┐
               ├── test-frontend ──┼── test-e2e (main only)
               └── build           │
```

| Job | Purpose | Depends on |
|-----|---------|------------|
| `build-shared` | Compiles `shared-types` and uploads as artifact | — |
| `test-backend` | Runs backend unit + integration tests with PostgreSQL | `build-shared` |
| `test-frontend` | Runs frontend unit + component tests | `build-shared` |
| `build` | Verifies both backend and frontend compile | `build-shared` |
| `test-e2e` | Playwright E2E tests (Chromium) | `test-backend`, `test-frontend` |

## Key design decisions

- **Concurrency with cancel-in-progress** — If a new push arrives while CI is still running, the old run is cancelled to save resources.
- **`--frozen-lockfile`** — Ensures exact dependency versions from the lockfile are used (no unexpected upgrades).
- **Artifact passing** — `shared-types` is built once in `build-shared` and shared across all other jobs via artifacts, avoiding redundant builds.
- **Service containers** — PostgreSQL runs as a Docker service in the GitHub runner with health checks (`pg_isready`) to ensure it's ready before tests start.
- **E2E gated to main** — Playwright tests only run on pushes/PRs to `main`, avoiding expensive browser tests on feature branches.
- **Environment variables** — All config (DB, JWT, API keys) is set at the job level using test/dummy values for CI safety.
- **Playwright report artifacts** — If E2E tests fail, the Playwright report is uploaded and retained for 7 days for debugging.
