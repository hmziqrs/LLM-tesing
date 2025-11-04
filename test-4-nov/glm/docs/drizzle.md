# Drizzle ORM Notes

## Overview
The Drizzle ORM README describes Drizzle as a “headless ORM for NodeJS, TypeScript and JavaScript” that is “lightweight at only ~7.4kb minified+gzipped” with zero dependencies and support for “every PostgreSQL, MySQL and SQLite database, including serverless ones like Turso, Neon, PlanetScale, Cloudflare D1, Vercel Postgres, Supabase, [and] AWS Data API” ([Drizzle ORM README, retrieved 2024‑11‑04](https://raw.githubusercontent.com/drizzle-team/drizzle-orm/main/README.md)).

## Why We Use It
- Tree-shakeable, dependency-free core keeps our bundle and cold starts small (important for Bun).
- Works across runtimes (Node, Bun, Deno, Workers) so the same schema can power migrations and API workers.
- Drizzle Kit CLI gives schema diffing + migration generation that fits CI and local workflows.

## Highlights from the Docs
- **SQL Schema Declaration**: Define tables/columns in TypeScript while staying close to raw SQL.
- **Relational & SQL-like Queries**: Compose typed queries without sacrificing flexibility.
- **Ecosystem Tools**: Drizzle Kit for migrations and Drizzle Studio for database inspection.

## Integration Checklist
1. Define schema modules inside `packages/contracts/db` so both web and API layers share types.
2. Run `drizzle-kit generate` whenever schema changes to emit SQL migrations.
3. Initialize a shared Postgres pool in the Hono API using Drizzle’s Postgres adapter.
4. Use dockerized Postgres or transactional tests to keep Vitest suites isolated.

## Helpful Commands
- `pnpm drizzle:generate` – Generate SQL migrations.
- `pnpm drizzle:push` – Apply migrations locally (exposed via workspace script).
- `pnpm drizzle:studio` – Optional GUI to inspect tables.

## Docs & References
- README overview: https://raw.githubusercontent.com/drizzle-team/drizzle-orm/main/README.md
- Documentation hub: https://orm.drizzle.team/docs/overview
- Drizzle Kit docs: https://orm.drizzle.team/docs/kit-overview

*Network access is restricted; consult the official docs when online for deeper coverage.*
