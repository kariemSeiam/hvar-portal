# Build
FROM oven/bun:1.2 AS builder
WORKDIR /app

# Install deps
COPY web/package.json web/bun.lock ./
RUN bun install --frozen-lockfile

# Build
COPY web ./
RUN bun run build

# Runtime
FROM oven/bun:1.2-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist

EXPOSE 4321
CMD ["bun", "dist/server/entry.mjs"]
