# Build
FROM oven/bun:1.2 AS builder
WORKDIR /app

# Install deps
COPY api/package.json api/bun.lock ./
RUN bun install --frozen-lockfile

# Build
COPY api/src ./src
RUN bun build src/index.ts --outdir dist --target bun

# Runtime
FROM oven/bun:1.2-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist

EXPOSE 5000
CMD ["bun", "dist/index.js"]
