# ── Stage 1: Install dependencies ──────────────────────────────────────────
FROM oven/bun:1 AS deps
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# ── Stage 2: Build ──────────────────────────────────────────────────────────
FROM oven/bun:1 AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
# ENCRYPTION_KEY is required at runtime, not build time.
# Provide a dummy value so `next build` doesn't throw on import.
ENV ENCRYPTION_KEY=0000000000000000000000000000000000000000000000000000000000000000

RUN bun --bun next build

# ── Stage 3: Production runner ──────────────────────────────────────────────
FROM oven/bun:1 AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN groupadd --system --gid 1001 nodejs \
 && useradd  --system --uid 1001 --gid nodejs nextjs

# Copy standalone build output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static   ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public          ./public

# Create persistent-data directories and hand ownership to the app user
RUN mkdir -p /data /app/public/uploads \
 && chown -R nextjs:nodejs /data /app/public/uploads

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["bun", "--bun", "server.js"]
