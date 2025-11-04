# PostgreSQL Usage Notes

## Overview
The PostgreSQL 18 manual describes PostgreSQL as “an object-relational database management system (ORDBMS)… [that] supports a large part of the SQL standard and offers many modern features: complex queries, foreign keys, triggers, updatable views, transactional integrity, [and] multiversion concurrency control” ([PostgreSQL Docs §1, retrieved 2024‑11‑04](https://www.postgresql.org/docs/current/intro-whatis.html)). PostgreSQL is open source, extensible (custom data types, functions, operators, index methods, procedural languages), and can be used or modified freely.

## Key Practices
- Run PostgreSQL via Docker Compose locally with persistent volumes.
- Enforce strict role-based access: application role (limited DML) and migration role (DDL).
- Use schemas/namespaces (`public` vs `audit`) to separate core tables from logging artifacts.
- Enable extensions like `pgcrypto` (for UUIDs) and `pg_stat_statements` when available.

## Operations Checklist
1. Maintain `.env` entries for `DATABASE_URL`, `SHADOW_DATABASE_URL` (for Drizzle), and migration credentials.
2. Automate migrations in CI/CD using `drizzle-kit` before deploying application containers.
3. Schedule daily logical backups and weekly physical snapshots; document restore steps in the ops runbook.
4. Monitor with Uptime Kuma checks plus Postgres-native metrics (connections, replication lag, slow queries).

## Helpful Commands
- `docker compose up postgres -d` – Start the local database.
- `pnpm drizzle:push` – Apply migrations.
- `psql $DATABASE_URL` – Open a psql shell for debugging.

## Docs & References
- Overview section: https://www.postgresql.org/docs/current/intro-whatis.html
- General docs: https://www.postgresql.org/docs/current/
- Backup guide: https://www.postgresql.org/docs/current/backup-dump.html
- Performance checklist: https://wiki.postgresql.org/wiki/Performance_Optimization

*Network requests are disabled in this environment; use the official links when connectivity is available.*
