# better-auth Notes

## Overview
The Better Auth README calls the project “the most comprehensive authentication framework for TypeScript” and highlights framework-agnostic design plus features such as 2FA and multi-tenant support via plugins ([Better Auth README, retrieved 2024‑11‑04](https://raw.githubusercontent.com/better-auth/better-auth/main/README.md)).

## Why We Use It
- First-class passkey/WebAuthn support lets us offer passwordless sign-in alongside email/password.
- Database adapters integrate with Drizzle/PostgreSQL so sessions and tenants stay in our primary datastore.
- Plugin ecosystem (2FA, multi-tenant, etc.) keeps advanced features configurable without third-party SaaS.

## Pull-outs from the Docs
- **Framework-Agnostic**: Works with any TypeScript backend, so Hono integration is straightforward.
- **Comprehensive Feature Set**: Built-in flows for passwords, passkeys, and OAuth; extend via plugins.
- **Security Posture**: Maintains MIT-licensed, open-source stack with responsible disclosure channel (security@better-auth.com).

## Integration Checklist
1. Install `better-auth` packages in `apps/api` and configure the Postgres/Drizzle adapter.
2. Implement signup, login, logout, and session endpoints via Hono routes.
3. Share session validation helpers with TanStack Start loaders to gate protected pages.
4. Configure passkeys, transactional email templates, and `.env` secrets validated by pnpm scripts.
5. Write integration tests for register/login/session refresh using Supertest or MSW.

## Helpful Commands
- `pnpm --filter api test auth` – Run auth-focused integration tests.
- `pnpm --filter web dev` – Verify loader guards using mock sessions during development.

## Docs & References
- README: https://raw.githubusercontent.com/better-auth/better-auth/main/README.md
- WebAuthn basics: https://webauthn.guide

*Network access is locked down, so references rely on known entry points. Update links if newer docs become available.*
