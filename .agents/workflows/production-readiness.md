# Reusable Workflow: Production-Readiness Assessment

**Pattern:** Operational Excellence & Go-Live Quality Gates  
**Goal:** Evaluate the complete system across reliability, scalability, security, and observability before production deployment.

---

## Pillar 1: Reliability & Health Checks
- [ ] Backend provides an unthrottled, fast `/api/health` endpoint.
- [ ] Database connection pooler (PgBouncer) handles connection bursts without dropping clients.
- [ ] L1 in-memory token cache handles transient remote Supabase latency spikes without crashing.
- [ ] Graceful shutdown handler is registered (`SIGTERM`/`SIGINT`) to drain active HTTP requests and close Prisma / Redis connections cleanly.

---

## Pillar 2: Security & DevSecOps
- [ ] Zero committed secrets, private keys, or credentials in git history.
- [ ] GitLeaks scanner passes cleanly.
- [ ] All API mutations enforce authentication and entity authorization.
- [ ] Helmet, CORS, and rate limiting are configured for production domain whitelists.
- [ ] Dependency CVE scan has zero high/critical unpatched vulnerabilities.

---

## Pillar 3: Scalability & Performance
- [ ] Client static assets are cached with immutable headers.
- [ ] Core database queries have matching indexes in Prisma schema.
- [ ] Redis cache TTLs are set to prevent memory unbounded growth (`maxmemory-policy allkeys-lru`).
- [ ] Kubernetes HPA is configured with minimum 2 replicas to avoid single-point failure during pod rollouts.

---

## Pillar 4: Observability & Logging
- [ ] Structured logging in place (`morgan` in production combined format).
- [ ] Errors include contextual metadata without exposing database connection strings or PII.
- [ ] Healthcheck probes in Docker Compose and Kubernetes are passing.

---

## Pillar 5: Deployment & Rollback Verification
- [ ] Production build succeeds cleanly (`npm run build`).
- [ ] Docker images build with multi-stage targets and non-root execution.
- [ ] Documented rollback procedure: previous container image tag or deployment hook reversion.
- **Expected Output:** Production Readiness Scorecard with Go / No-Go recommendation.
