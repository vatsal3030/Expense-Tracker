# Reusable Workflow: Performance Optimization

**Pattern:** Full-Stack Latency & Throughput Profiling  
**Goal:** Optimize client bundle size, API response latency, database queries, and caching tiers.

---

## Step 1: Baseline Performance Measurement
1. Measure API endpoint latencies under load:
   - Run benchmark with curl or autocannon:
     ```bash
     curl -w "Time: %{time_total}s | Status: %{http_code}\n" -o /dev/null -s http://localhost:5000/api/health
     ```
2. Measure frontend bundle size and First Contentful Paint (FCP):
   - Run Next.js build analyzer to detect oversized client chunks.

---

## Step 2: Database & Query Profiling (Prisma)
1. Enable Prisma query logging in development (`log: ['query', 'info', 'warn', 'error']`).
2. Identify N+1 query patterns:
   - Replace sequential `findUnique` loops with batch `findMany` using `where: { id: { in: [...] } }`.
   - Use `include` or `select` to fetch only required fields rather than broad `*` queries.
3. Check index coverage in `server/prisma/schema.prisma`:
   - Ensure foreign keys and filtered columns (`groupId`, `paidById`, `date`, `userId`) have corresponding `@@index` annotations.

---

## Step 3: Caching Tier Tuning (L1 Memory + L2 Redis)
1. Review L1 token caching in `server/src/middleware/auth.ts`:
   - Verify token cache hit rate.
   - Ensure in-flight request deduplication prevents concurrent duplicate token verifications.
2. Review L2 Redis caching in `server/src/lib/cache.ts`:
   - Set appropriate TTLs for static vs. volatile entities (e.g., exchange rates: 1 hour, group metadata: 5 minutes).
   - Invalidate cache entries deterministically on create/update/delete events.

---

## Step 4: Frontend Asset & Render Optimization
1. Dynamic imports for heavy components:
   - Lazy-load Recharts and QR code generation using `next/dynamic` with `ssr: false`.
2. Font optimization:
   - Use `next/font/google` for self-hosted zero-layout-shift fonts.
3. Image optimization:
   - Use `next/image` with explicit width/height and modern WebP/AVIF formats.

---

## Step 5: Optimization Deliverables
- **Expected Output:**
  - Before / After latency benchmarks (p50, p95, p99).
  - Reduced bundle size report.
  - Verification that all automated tests still pass.
