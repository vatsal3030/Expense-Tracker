# 🌟 Owino / FairShare — Antigravity Agent Engineering Guide

Welcome to **Owino (FairShare)**, a cloud-native, microservices-based expense sharing and debt minimization SaaS platform.
Every AI agent operating in this repository is expected to act like a disciplined senior engineer: **understand first, plan properly, implement minimally, test thoroughly, review critically, and never compromise production quality.**

---

## 1. Domain & Business Model Overview

Owino solves the multi-party group expense problem. When roommates, travel groups, or project teams incur shared costs, bilateral debts multiply into an overwhelming web of payments.

### The Algorithmic Core: Greedy Debt Simplification
- Debts are modeled as a **Directed Acyclic Graph (DAG)**.
- Owino computes the net financial balance of each participant (`Credits - Debits`).
- A greedy graph minimization loop in `server/src/routes/group.routes.ts` (mounted in `expense.service.ts` on port 5002) matches the largest debtor with the largest creditor, slashing overall transactions by up to **70%**.
- Settlements are finalized with real-time dynamic UPI payment QR codes (`qrcode`).
- **Mathematical Invariant:** Net balance across any group must conserve zero (`sum(netBalances) === 0`).

---

## 2. Repository Blueprint & Folder Architecture

```text
e:\Expense_tracker/
├── AGENTS.md                          # Master project rules and agent guidelines
├── package.json                       # Monorepo root scripts (dev, build, lint, db:*)
├── docker-compose.yml                 # Local development Docker setup (Monolith :5000 + Client :3000)
├── docker-compose.prod.yml            # Production setup (NGINX + Redis + 4 Microservices + Client)
├── client/                            # Next.js 16 App Router frontend
│   ├── src/
│   │   ├── app/                       # 18 page routes (dashboard, expenses, groups, settlements, etc.)
│   │   ├── components/                # Reusable UI components & modals
│   │   ├── lib/                       # api.ts (Axios), supabase.ts, utils.ts
│   │   └── theme/                     # Material UI and styling theme definitions
│   └── package.json                   # Client dependencies (React 19, Tailwind v4, MUI v9, Recharts)
├── server/                            # Node.js + Express + TypeScript backend
│   ├── src/
│   │   ├── index.ts                   # Monolithic Express entry point (:5000)
│   │   ├── lib/                       # prisma.ts, cache.ts (L1/L2), socket.ts, supabase.ts
│   │   ├── middleware/                # auth.ts (L1 token cache + JWT), validate.ts (Zod), errorHandler.ts
│   │   ├── routes/                    # 15 Express route modules
│   │   └── services/                  # 4 decoupled microservices for production
│   │       ├── identity.service.ts    # Port 5001: Auth, Users, Friends
│   │       ├── expense.service.ts     # Port 5002: Expenses, Groups, Budgets
│   │       ├── settlement.service.ts  # Port 5003: Settlements, DAG Engine, Dashboard, Export
│   │       └── notification.service.ts# Port 5004: WebSockets, Notifications, Activities
│   └── prisma/schema.prisma           # Relational schema (PostgreSQL on Supabase Sydney)
├── nginx/                             # API Gateway configuration (port 80 reverse proxy)
├── k8s/                               # Kubernetes manifests (Deployments, HPA, Ingress, ConfigMaps)
├── terraform/                         # Infrastructure as Code (Kubernetes namespace & secrets)
├── .github/workflows/                 # CI/CD (lint, typecheck, GitLeaks, Trivy, build, deploy)
└── .agents/                           # Antigravity AI-Native Engineering Toolkit
    ├── rules/                         # Enforced rules (security, architecture, quality gates, boundaries)
    ├── skills/                        # Reusable skills (debugging, TDD, security, design system, minimalism)
    └── workflows/                     # 12 standardized engineering workflows
```

---

## 3. Dual-Mode Runtime Parity

Owino operates in two runtime paradigms. Any backend change MUST be compatible with both:
1. **Development Monolith (`npm run dev:server`):** Single Express server (`server/src/index.ts`) listening on port 5000 mounting all 15 routers under `/api/*`.
2. **Production Decoupled Microservices (`docker-compose.prod.yml`):**
   - **Port 5001:** `identity.service.ts` -> `/api/auth`, `/api/users`, `/api/friends`
   - **Port 5002:** `expense.service.ts` -> `/api/groups`, `/api/expenses`, `/api/budgets`
   - **Port 5003:** `settlement.service.ts` -> `/api/settlements`, `/api/dashboard`, `/api/export`
   - **Port 5004:** `notification.service.ts` -> `/api/notifications`, `/api/activities`, `/socket.io`
   - **Port 80 (NGINX Gateway):** Routes path prefixes to the respective service container and `/*` to Next.js Client (:3000).

---

## 4. Database & Relational Data Model

- **Database Engine:** PostgreSQL hosted on Supabase (`ap-southeast-2` Sydney).
- **ORM:** Prisma ORM 6.1.0 (`server/prisma/schema.prisma`).
- **Connection Strategy:**
  - `DATABASE_URL`: PgBouncer connection pooler on port 6543 (used by application runtime).
  - `DIRECT_URL`: Direct PostgreSQL connection on port 5432 (used by Prisma migrations).
- **Core Models:**
  - `User`: Accounts, auth bindings (`supabaseId`), currency preferences.
  - `Friendship`: Bilateral friendship states (`PENDING`, `ACCEPTED`, `BLOCKED`).
  - `Group` & `GroupMember`: Shared expense containers with role-based permissions (`ADMIN`, `MEMBER`).
  - `Expense` & `ExpenseShare`: Expenses with amounts (`Decimal(12, 2)`), split types (`EQUAL`, `EXACT`, `PERCENTAGE`, `SHARES`), and per-user share tracking.
  - `Settlement`: Bilateral payment records with statuses (`PENDING`, `CONFIRMED`, `REJECTED`).
  - `RecurringExpense` & `Budget`: Automated rules and category spending limits with threshold alerts.
  - `Notification` & `Activity`: Real-time audit trails and user notification logs.

---

## 5. Authentication, Authorization & Caching

1. **Token Lifecycle:**
   - Client authenticates via Supabase Auth and passes Bearer JWT in the `Authorization` header.
   - `server/src/middleware/auth.ts` intercepts requests with high-speed performance:
     - **L1 In-Memory Token Cache:** Checks in-memory cache first (0.00ms).
     - **In-Flight Request Deduplication:** Prevents 5-7 parallel frontend requests from spamming remote auth verification.
     - **Fast Local JWT Decode:** Decodes and checks claims before falling back to remote Supabase verification.
     - **L2 Redis Cache:** Stores resolved DB user objects to eliminate latency to the Sydney database.
2. **Authorization Invariants (Anti-IDOR):**
   - Every route querying or modifying private entities (groups, expenses, settlements) MUST verify that `req.user.id` is an active member or owner.
   - Admin actions require `GroupMember.role === 'ADMIN'`.

---

## 6. Frontend Conventions & FinTech Design System

- **Stack:** Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS v4 + Material UI v9.
- **Client Components:** Default to React Server Components; use `'use client'` only for interactive state, browser hooks, or event listeners.
- **Visual Design:**
  - Follow the **Owino FinTech Design System** (`ui-ux-design-system` skill).
  - Backgrounds: Neutral slate `#0A0D14` with card elevation `#121620` and borders `#1A202E`.
  - Financial Status: Emerald `#10B981` (You are owed), Rose `#F43F5E` (You owe), Slate `#94A3B8` (Settled).
  - Contrast: Minimum 4.5:1 text contrast (WCAG AA).
  - Numbers: Use tabular numbers (`font-mono` or `font-feature-settings: 'tnum'`).
  - Icons: Use `lucide-react` exclusively. No emoji icons in UI.

---

## 7. DevSecOps & Security Requirements

1. **Zero Secret Exposure:** Never commit `.pem`, `.key`, or `.env*` files. Never hardcode passwords or API keys as default fallbacks in Docker Compose or Terraform.
2. **Parameterized Queries:** All DB operations must use Prisma ORM parameterized queries. Never use unescaped string concatenation in `$queryRaw`.
3. **Idempotency:** Payment and expense creation endpoints MUST respect the `Idempotency-Key` header.
4. **Input Validation:** All controller payloads MUST be validated using Zod schemas via `validate` middleware.

---

## 8. Development & Testing Commands

```bash
# Install all dependencies across monorepo
npm run postinstall

# Run local development (Monolith server :5000 + Client :3000)
npm run dev

# Run individual services
npm run dev:client         # Next.js frontend
npm run dev:server         # Monolith Express server
npm run dev:identity       # Microservice 1 (Identity :5001)
npm run dev:expense        # Microservice 2 (Expense :5002)
npm run dev:settlement     # Microservice 3 (Settlement :5003)
npm run dev:notification   # Microservice 4 (Notification :5004)

# Database operations
npm run db:generate        # Regenerate Prisma Client
npm run db:migrate         # Run Prisma migrations in dev
npm run db:studio          # Launch Prisma Studio GUI

# Linting & Type Checking
npm run lint               # Lint both client and server
cd client && npx tsc --noEmit # Typecheck frontend
cd server && npx tsc --noEmit # Typecheck backend

# Testing
cd client && npx playwright test # Run Playwright E2E test suite
```

---

## 9. Protected Boundaries: What Must NEVER Be Changed Without Approval

1. **Greedy Debt Simplification DAG Logic** in `server/src/routes/group.routes.ts`.
2. **Prisma Schema Destructive Changes** (`prisma db push --force` or dropping existing columns).
3. **Port & Reverse Proxy Mappings** in `nginx/nginx.conf` and `docker-compose.prod.yml`.
4. **Production Cloud Infrastructure** in `terraform/` and `k8s/` (no automated applies without diff approval).

---

## 10. Behavioral Directives for Agents

1. **Inspect Before Creating (Ponytail Rule):** Always check `client/src/lib/`, `client/src/components/`, and `server/src/lib/` before writing a new helper, component, or utility. Reuse existing code first.
2. **Keep Diffs Minimal:** Prefer a surgical 10-line change over a 200-line rewrite.
3. **Red/Green TDD for Financial Math:** Any change touching balance calculations or splits MUST have a corresponding automated test.
4. **Evidence-Based Reviews:** Support all code review feedback with file paths, line numbers, reproduction payloads, and concrete remediation diffs.
5. **No Hallucinated Test Results:** Never report that tests or builds succeeded without actually executing them and inspecting the terminal output.

---

<!-- BEGIN AWS Agent Toolkit rules -->
# AWS Guidance for the new AWS experience

This user has signed up for the new AWS experience. This experience lets you sign into AWS using a social provider and requires the following additional context.

Where this guidance conflicts with the project's own instructions, the project's instructions take precedence.

## Context

### Terminology:

- Say "project" instead of "account" — a project contains an AWS account and settings for sharing with other collaborators
- Say "team member" instead of "IAM user" — users are invited by email, not created or federated in IAM
- Say "AWS Settings" when referring to management tasks at [settings.aws.com](https://settings.aws.com/) (project management, billing, team members, spend limits). Users view their actual AWS resources in the AWS Management Console.
- Say "selected Region" when referring to the user's Region — not "home Region"
- The user has a managed IAM experience. This includes a managed service control policies (SCP) and resource control policies (RCP) that govern the use of AWS. They will still need to use IAM to create policies to let services work with each other. If there are questions about the SCPs or RCPs, go to the documentation at https://docs.aws.amazon.com/accounts/latest/reference/scps-and-rcps-for-projects.html

### Constraints:

- All projects share a single AWS Region determined by the user's contact address. Resources cannot be created in other Regions
- When developing:
  - MUST create all Regional resources in the project's assigned Region
  - You CAN create AWS WAF and Cloudwatch Logs resources in us-east-1 when there are global resources (like a global WAF instance) that require a connection to dependencies in us-east-1. You should not use these for any other reason, because resources in the selected Region will provide lower cost (due to no cross-Region traffic), increased availability (due to no cross-Region traffic), and easier manageability (due to not needing to look in another Region). When you need to do an inventory of resources, you need to look in both the selected Region and us-east-1 for Cloudwatch Logs or WAF resources.
  - MUST NOT attempt to create Lambda, API Gateway, or other Regional resources in any other Region
  - MUST direct users to confirm their Region in AWS Settings > View all projects > Overview > Additional Info > Region. If the user cannot confirm their Region, check in ~/.aws/config
  - MUST NOT use Lambda@Edge — excluded from both Lambda and CloudFront
  - MUST NOT use CloudFormation StackSets — no multi-account or multi-Region deployments
  - MUST NOT attempt cross-Region actions — no cross-Region replication for DynamoDB/S3/RDS, no multi-Region KMS keys
  - MUST NOT use Route 53 cross-Region routing — geolocation, latency-based, and failover routing policies are not available
  - CloudFront is a global service and its actions ARE allowed in `us-east-1`. A user can create a CloudFront distribution pointing to their project-region Lambda function URL or API Gateway. However, Lambda and API Gateway themselves MUST NOT be created in `us-east-1` — they must be in the project Region.
  - Reduced availability in `eu-north-1` specifically: Amazon Rekognition, Amazon Textract, Amazon Personalize, AWS App Runner are not available in that Region.
- IAM permissions for human access are managed by AWS. Don't assign roles to team members unless absolutely necessary
- The user may have a spend limit if they are on the paid plan. The limit that pauses their project if it's exceeded. If resources suddenly become inaccessible, ask if they have a spend limit configured. Only project owners can modify a spend limit.
- When developing:
  - MUST ask about spend limit status if the user reports sudden "Access Denied" errors on operations that previously worked
  - MUST direct users to check spend status in AWS Settings > Billing
  - MUST check if a user has upgraded their account to the paid plan
  - MUST ask the user if they want to clean up the successfully created resources or keep them to reduce cost
- The user sets up billing, creates spend limits, and retrieves and pays invoices in AWS Settings. The user creates budgets and optimizes their costs in the AWS Billing and Cost Management console
- Not all AWS services are available. If a service isn't working, do the following:
  1. Run the command `aws freetier get-account-plan-state`
  2. If accountPlanType": "FREE", check the [Free Tier supported services list](https://docs.aws.amazon.com/accounts/latest/reference/supported-services-sign-up-new.html#supported-services-free-tier) next,
  3. If accountPlanType": "PAID", check the [Paid Tier supported services list](https://docs.aws.amazon.com/accounts/latest/reference/supported-services-sign-up-new.html#supported-services-paid-plan).
  4. If neither list shows the service, check the [Not supported for this experience list](https://docs.aws.amazon.com/accounts/latest/reference/supported-services-sign-up-new.html#unsupported-services). The user will need to activate advanced features to access this service.
- Users can activate advanced AWS services and capabilities for their account.
- Before starting a task, check whether a relevant AWS skill is available. Load the skill with retrieve_skill and prefer its guidance over general knowledge.

### Help level

- help_level (required): HIGH. I explain what I'm doing, suggest alternatives, and flag best practices.

<!-- END AWS Agent Toolkit rules -->
