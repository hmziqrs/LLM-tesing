# Pino Logging Notes

## Overview
The Pino README labels the project a “very low overhead JavaScript logger” and documents runtime support for Node.js plus compatibility modules for Bare/Pear environments ([Pino README, retrieved 2024‑11‑04](https://raw.githubusercontent.com/pinojs/pino/master/README.md)).

## Why We Use It
- Structured JSON output is easy to parse in log aggregation tools.
- Child loggers provide per-request context and correlate entries with ORPC procedure calls.
- Native serializers help redact sensitive fields (e.g., credentials) before logs leave the server.

## Integration Checklist
1. Create a shared logger factory that configures base fields (service name, environment, version).
2. Add Hono middleware to inject a child logger with `requestId` into the context for each request.
3. Wrap ORPC handler execution to log start/finish time and error details when applicable.
4. Configure TanStack Start server entry to reuse the same logger for SSR events.
5. Ship logs to stdout in production; let the platform forward them to your log sink.

## Helpful Commands
- `pnpm --filter api dev` – Run API with live logging in the console.
- `pnpm --filter api test` – Ensure tests assert on logger output where relevant (use `pino-pretty` locally).

## Docs & References
- README overview: https://raw.githubusercontent.com/pinojs/pino/master/README.md
- Official docs: https://getpino.io
- Redaction guide: https://getpino.io/#/docs/redaction
- Transport examples: https://getpino.io/#/docs/transports

*Unable to fetch new docs in this environment; links above reflect the canonical sources.*
