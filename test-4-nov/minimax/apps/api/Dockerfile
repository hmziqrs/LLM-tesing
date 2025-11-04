FROM oven/bun:1.2 AS base

WORKDIR /app

COPY package.json bun.lockb ./
COPY packages/api/package.json ./packages/api/
COPY packages/db/package.json ./packages/db/
COPY packages/contracts/package.json ./packages/contracts/

RUN bun install --frozen-lockfile

COPY packages ./packages
COPY apps/api ./apps/api

WORKDIR /app/apps/api

RUN bun run build

FROM oven/bun:1.2 AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

COPY --from=base /app/packages ./packages
COPY --from=base /app/apps/api ./apps/api
COPY --from=base /app/package.json ./package.json
COPY --from=base /app/bun.lockb ./bun.lockb

WORKDIR /app/apps/api

EXPOSE 3001

CMD ["bun", "run", "start"]
