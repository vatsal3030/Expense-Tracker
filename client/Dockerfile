# ============================================================================
# FairShare Client — Dockerfile (Next.js Standalone)
# ============================================================================

FROM node:20-alpine AS base

# --- Dependencies ---
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# --- Build ---
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS="--max-old-space-size=2048"

ARG NEXT_PUBLIC_SUPABASE_URL=https://eqtmygiizyehikodaxpe.supabase.co
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_YJzGFp2HW1qjOrnjGO618g_2CXVUTr3
ARG NEXT_PUBLIC_API_URL=/api

ENV NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL:-https://eqtmygiizyehikodaxpe.supabase.co}
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY:-sb_publishable_YJzGFp2HW1qjOrnjGO618g_2CXVUTr3}
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL:-/api}

RUN npm run build

# --- Production ---
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
