# Hono Backend Service Notes

## Overview
The Hono README describes the framework as “a small, simple, and ultrafast web framework built on Web Standards” that “works on any JavaScript runtime: Cloudflare Workers, Fastly Compute, Deno, Bun, Vercel, AWS Lambda, Lambda@Edge, and Node.js” ([Hono README, retrieved 2024‑11‑04](https://raw.githubusercontent.com/honojs/hono/main/README.md)).

## Why We Use It
- Ultrafast router (`RegExpRouter`) keeps latency low for budget APIs.
- Lightweight core with zero dependencies fits edge/bun deployment targets.
- Built-in middleware ecosystem and TypeScript support simplify better-auth + Pino integration.

## Key Points from the Docs
- **Multi-runtime**: Same codebase deploys to Workers, Bun, Node, Lambda, etc.
- **Batteries Included**: Official and third-party middleware cover auth, logging, cors, compression.
- **Delightful DX**: Type definitions and small API surface make route handlers concise.

## Integration Checklist
1. Scaffold `apps/api` with `npm create hono@latest` targeting Bun.
2. Install `hono`, `@hono/node-server`, and `@hono/zod-validator` for schema validation.
3. Register middleware for better-auth sessions, Pino logging (see `docs/pino.md`), and rate limiting.
4. Wrap ORPC dispatchers inside Hono handlers and surface consistent error responses.
5. Expose `/healthz` and `/readyz` endpoints for Uptime Kuma monitoring.

## Helpful Commands
- `pnpm --filter api dev` – Start the Hono development server.
- `pnpm --filter api build` – Bundle the service for production.
- `pnpm --filter api start` – Run the compiled output locally.

## Docs & References
- README source: https://raw.githubusercontent.com/honojs/hono/main/README.md
- Official docs: https://hono.dev
- Middleware guide: https://hono.dev/docs/guides/middleware
- Node runtime guide: https://hono.dev/docs/getting-started/nodejs
