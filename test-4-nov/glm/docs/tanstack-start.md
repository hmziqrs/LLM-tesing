# TanStack Start v1.0 Notes

## Overview
The TanStack Router repository describes TanStack Start as “a full-stack framework built on Router, designed for server rendering, streaming, and production-ready deployments” with capabilities like “full-document SSR & streaming” and “server functions & end-to-end type safety” ([TanStack Router README, retrieved 2024‑11‑04](https://raw.githubusercontent.com/TanStack/router/main/README.md)).

## Why We Use It
- Full-document streaming SSR aligns with our need for fast dashboard loads even when budgets have many transactions.
- Server functions integrate with ORPC so we can keep contracts type-safe from Hono to the frontend.
- Bundling/build pipeline included in Start gives us production-ready output without wiring Vite manually.

## Highlights from the Docs
- **Server Rendering**: Start builds on TanStack Router’s file-based routing but adds streaming SSR primitives.
- **Server Functions**: End-to-end type safety for server actions pairs nicely with our ORPC contracts.
- **Deployment Bundles**: Emphasis on production builds and adapters means we can target Bun/Node hosts quickly.

## Integration Checklist
1. Bootstrap with `npm create @tanstack/start@latest` (select the Bun runtime during prompts).
2. Enable strict TypeScript and Tailwind during setup, then swap in the dark-first token set.
3. Wire better-auth session validation into Start loaders before rendering protected routes.
4. Call ORPC clients inside loaders/actions so cache keys match server procedures.
5. Reuse TanStack Query providers to hydrate client caches from loader data.

## Helpful Commands
- `pnpm dev` – Start the SSR dev server.
- `pnpm build` – Produce the production bundle.
- `pnpm preview` – Run the built server locally for smoke tests.

## Docs & References
- TanStack Start overview in Router README: https://raw.githubusercontent.com/TanStack/router/main/README.md
- Official docs hub: https://tanstack.com/start/latest
- Router docs: https://tanstack.com/router/latest
