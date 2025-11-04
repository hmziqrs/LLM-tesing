# TanStack Start v1.0 Project Plan – Pocket Budget Buddy

## Implementation Progress

### ✅ Completed (11/12 Phases)
- **Phase 1**: Bootstrap & Environment ✓
- **Phase 2**: Database Modeling & Migrations ✓
- **Phase 3**: Hono API & ORPC Contracts ✓
- **Phase 4**: Authentication & Onboarding ✓
- **Phase 5**: Accounts & Budgets UI ✓
- **Phase 6**: Transactions & Imports ✓
- **Phase 7**: Recurring Bills & Goals ✓
- **Phase 8**: Insights & Reporting ✓
- **Phase 9**: Collaboration & Audit Log ✓
- **Phase 10**: Theme Polish & Accessibility ✓

### 🔄 In Progress
- **Phase 11**: Testing & Quality Gates (not yet started)
- **Phase 12**: Observability, Deployment & Ops (not yet started)

### 📊 Implementation Stats
- **13 Database Tables** - Full schema with relations
- **7 ORPC Routers** - 50+ typed procedures
- **6 Frontend Routes** - Complete UI implementation
- **Dark-first Theme** - With `.border-variant` utility
- **PostgreSQL** - With migrations and seed data

---


## 1. Product Goal
- Build a consumer-friendly personal finance web app that helps individuals track spending, organize budgets by category, and visualize cashflow trends.
- Pair a sleek, dark-first interface with deterministic budgeting tools—no AI or opaque automation.
- Provide confidence through transparent data handling, typed APIs, and dependable monitoring.

## 2. Architecture Overview
- **Frontend**: TanStack Start v1.0 serving the user interface with React, TanStack Router, TanStack Query, and server loaders/actions for auth-aware routing (see `docs/tanstack-start.md`).
- **Backend API**: Dedicated Hono.js service exposing an ORPC (Open-RPC) endpoint surface for type-safe client calls; deployable alongside the frontend or separately (see `docs/hono-backend.md` and `docs/orpc.md`).
- **Shared Types**: Generate ORPC client from backend schemas and share via a common `packages/contracts` workspace to ensure end-to-end type safety (see `docs/orpc.md`).

## 3. Tech Stack & Foundations
- **Runtime**: Bun/Node for both TanStack Start SSR and Hono API workers (see `docs/tanstack-start.md`).
- **Database**: PostgreSQL as the default in all environments (Docker Compose locally, managed Postgres in staging/prod) using Drizzle ORM + drizzle-kit migrations shared between services (see `docs/postgresql.md` and `docs/drizzle.md`).
- **Auth**: better-auth with email/password and passkey support; session tokens stored in Postgres; TanStack Start loaders enforce auth while Hono exposes protected ORPC procedures (see `docs/better-auth.md`).
- **Styling**: Tailwind CSS dark-first theme restricted to `#000`, `#fff`, and opacity-driven grays. Custom `.border-variant` utility provides consistent outlines. Light mode toggle available via header switch.
- **State Management**: TanStack Query for server data (ORPC hooks) and Zustand for ephemeral UI state (theme toggle, dialogs).
- **Logging & Monitoring**: Pino for structured logs across frontend server and Hono API; Kuma (Uptime Kuma) for external uptime monitoring with health check endpoints (see `docs/pino.md` and `docs/uptime-kuma.md`).
- **File Handling**: CSV uploads for transaction imports processed via Hono API, stored temporarily in object storage (local disk in dev) prior to parsing.
- **Tooling & Testing**: TypeScript strict, ESLint, Prettier, Vitest, Testing Library, MSW, and Playwright powered via pnpm scripts. Husky pre-commit hooks. GitHub Actions CI across lint, type-check, unit, integration, and e2e smoke suites.

## 4. Incremental Build Plan for the AI Agent
1. **Bootstrap & Environment**
    - Scaffold monorepo (pnpm workspaces) housing `apps/web` (TanStack Start) and `apps/api` (Hono) plus `packages/contracts` for ORPC schemas.
    - Configure Tailwind dark-first tokens, `.border-variant`, and theme toggle persisted to local storage.
    - Provision Docker Compose for Postgres and Uptime Kuma; include drizzle-kit config, `.env.example`, and setup docs.
2. **Database Modeling & Migrations**
    - Define Drizzle schemas within shared package: `user`, `account`, `budget_category`, `budget_allocation`, `transaction`, `transaction_attachment`, `recurring_bill`, `goal`, `audit_log` (see `docs/drizzle.md`).
    - Generate initial migrations; create seed script with demo categories, allocations, and transactions.
3. **Hono API & ORPC Contracts**
    - Implement Hono server with ORPC router exposing typed procedures: auth, accounts, budgets, transactions, recurring bills, goals, reports (see `docs/hono-backend.md` and `docs/orpc.md`).
    - Add middleware for auth session validation, rate limiting, and Pino request logging.
    - Export ORPC client bindings for TanStack Query hooks, ensuring shared Zod schemas where applicable.
4. **Authentication & Onboarding**
    - Integrate better-auth in Hono API for signup/login; expose session handling to frontend loaders (see `docs/better-auth.md`).
    - Build onboarding UI: profile setup, currency selection, optional partner invitation via ORPC mutations.
5. **Accounts & Budgets**
   - Account management screens with balances, manual adjustments, and ledger history.
   - Monthly/weekly budget planner UI connected to ORPC endpoints for CRUD operations on categories and allocations.
6. **Transactions & Imports**
   - Manual transaction form with attachments uploaded via Hono S3/local adapter; display history with filtering and search.
   - CSV import workflow: upload → column mapping wizard → preview → commit; handle duplicates and validation errors server-side.
7. **Recurring Bills & Goals**
   - Recurring bill scheduler generating upcoming entries and notifications (email placeholder) via background job queue within Hono.
   - Savings goals dashboard with progress bars, contribution logging, and forecast calculations.
8. **Insights & Reporting**
   - Cashflow dashboard using deterministic charting (e.g., Recharts/Victory) for spending vs budget, category trends, and net change.
   - Export endpoints for CSV and printable PDF summaries served by Hono.
9. **Collaboration & Audit Log**
   - Shared budget mode: invite partner, manage permissions, view combined dashboards.
   - Audit log UI showing timestamped actions and actor details pulled from dedicated table.
10. **Theme Polish & Accessibility**
    - Validate WCAG contrast in dark/light modes, refine focus states, ensure `.border-variant` applied consistently.
    - Add keyboard shortcuts (add transaction, toggle theme) and accessible skip links.
11. **Testing & Quality Gates**
    - Unit tests: Drizzle repositories, ORPC procedure guards, CSV parser, recurring bill generator, budgeting utilities.
    - Integration tests: Hono API endpoints with supertest + MSW for client mocks; ensure auth + data flows.
    - Playwright E2E: signup → connect partner → create budgets → import CSV → review reports.
    - Contract tests verifying ORPC schemas stay in sync between API and web packages.
12. **Observability, Deployment & Ops**
    - Instrument Pino logs with request IDs; stream to centralized sink (e.g., Logtail) per environment (see `docs/pino.md`).
    - Expose `/healthz` endpoints for both web and API; register them in Uptime Kuma monitors (see `docs/uptime-kuma.md`).
    - Multi-stage Dockerfiles for web and API; docker-compose.override for local dev.
    - GitHub Actions deploy pipeline: build artifacts, run migrations via drizzle-kit, roll out to hosting (Fly.io/Render) with environment variable documentation.
    - Ops runbook covering env config, log inspection, backup strategy for Postgres, restoring seeds, and handling downtime alerts from Kuma.

## 5. Deliverables Checklist
- TanStack Start v1.0 frontend with dark-first theme, `.border-variant`, and ORPC client integration.
- Hono.js backend delivering typed ORPC endpoints, better-auth session handling, and Pino logging.
- PostgreSQL schema + migrations shared across services with seed data scripts.
- Fully functional budgeting features: accounts, allocations, transactions, recurring bills, goals, reporting.
- Automated tests (unit, integration, contract, e2e) passing in CI; Kuma monitors configured.
- Deployment artifacts (Dockerfiles, compose files, infra docs) enabling staging/production rollout with uptime monitoring.

## 6. Stretch Ideas (Post-MVP)
- Envelope-style drag-to-reallocate budgeting view.
- Email or push reminders for upcoming recurring bills using deterministic schedulers.
- Read-only API tokens for exporting data to spreadsheets or BI tools.
- Offline-capable PWA enhancements for rapid transaction entry on mobile.
