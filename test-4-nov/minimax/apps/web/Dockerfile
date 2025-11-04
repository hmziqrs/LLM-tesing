FROM oven/bun:1.2 AS base

WORKDIR /app

COPY package.json bun.lockb ./
COPY apps/web/package.json ./apps/web/
COPY packages/db/package.json ./packages/db/
COPY packages/contracts/package.json ./packages/contracts/

RUN bun install --frozen-lockfile

COPY packages ./packages
COPY apps/web ./apps/web
COPY apps/api ./apps/api

WORKDIR /app/apps/web

RUN bun run build

FROM oven/bun:1.2 AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=base /app/packages ./packages
COPY --from=base /app/apps/web ./apps/web
COPY --from=base /app/apps/api ./apps/api
COPY --from=base /app/package.json ./package.json
COPY --from=base /app/bun.lockb ./bun.lockb

WORKDIR /app/apps/web

EXPOSE 3000

CMD ["bun", "run", "start"]
