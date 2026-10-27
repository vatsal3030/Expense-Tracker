# Protected Boundaries & Change Safeguards

To prevent accidental outages or financial discrepancies, the following subsystems are strictly guarded and MUST NEVER be altered without explicit, unambiguous approval from the lead architect/user.

## 1. Algorithmic Core: Greedy Debt Simplification
- **Location:** `server/src/routes/group.routes.ts` (`simplifyDebts`) & `server/src/services/settlement.service.ts`
- **Constraint:** The DAG minimization logic handles balance netting across all users. Any modification requires a formal test suite demonstrating mathematical correctness across multi-party debt cycles before any code changes.

## 2. Database Schema & Migration Records
- **Location:** `server/prisma/schema.prisma` and `server/prisma/migrations/`
- **Constraint:** Never run `prisma db push` or `prisma migrate dev` with destructive column deletions (`--force` or `--accept-data-loss`) against staging or production databases.
- Schema modifications require backwards-compatible additive changes with an explicit rollout migration plan.

## 3. Production Gateway & Port Allocations
- **Location:** `nginx/nginx.conf` and `docker-compose.prod.yml`
- **Constraint:** The port allocations are strictly mapped:
  - 80: NGINX Reverse Proxy
  - 3000: Next.js Client
  - 5000: Monolithic Dev Server
  - 5001: Identity Service
  - 5002: Expense Service
  - 5003: Settlement Service
  - 5004: Notification & WebSocket Service
  - 6379: Redis
  - 6543 / 5432: Supabase PostgreSQL
- Do not renumber ports or rewire proxy passes without explicit authorization.

## 4. Production Cloud Infrastructure
- **Location:** `terraform/` and `k8s/`
- **Constraint:** Never trigger automated `terraform apply` or `kubectl apply` against production environments. All IaC edits must be presented as planned diffs for manual review.
