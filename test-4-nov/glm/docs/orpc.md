# ORPC Contracts Notes

## Overview
The OpenRPC specification “defines a standard, programming language-agnostic interface description for JSON-RPC 2.0 APIs” so that “both humans and computers [can] discover and understand the capabilities of a service without requiring access to source code” ([OpenRPC Specification 1.3.2, retrieved 2024‑11‑04](https://spec.open-rpc.org/)).

## Why We Use It
- Shared OpenRPC documents keep TanStack Start clients and Hono handlers in sync.
- JSON Schema-based definitions drive validation, documentation, and code generation from one source.
- Versioned specs make it easy to expose the API to external consumers later.

## Key Concepts from the Spec
- **OpenRPC Document**: Top-level JSON describing methods, params, results, servers, and components.
- **Method Object**: Represents one RPC procedure; references input/output Content Descriptors.
- **Components Object**: Reusable schema pieces for DTOs (transactions, budgets, audit entries).
- **Service Discovery Method**: Optional `rpc.discover` method advertising the schema at runtime.

## Integration Checklist
1. Define procedures with Zod in `packages/contracts`, then emit JSON Schema + OpenRPC docs.
2. Generate TypeScript clients (e.g., via `@open-rpc/generator`) for TanStack Query hooks.
3. Validate inbound payloads on the Hono API against the same schemas before executing logic.
4. Version documents (`openrpc.v1.json`, `openrpc.v2.json`, …) as the contract evolves.
5. Run contract drift tests in CI to ensure server/clients stay aligned.

## Helpful Commands
- `pnpm --filter contracts build` – Emit generated clients/types.
- `pnpm test:contracts` – Run contract drift tests (wired through pnpm scripts/CI).

## Docs & References
- Specification: https://spec.open-rpc.org
- Repository: https://github.com/open-rpc/spec
- JSON Schema reference: https://json-schema.org
