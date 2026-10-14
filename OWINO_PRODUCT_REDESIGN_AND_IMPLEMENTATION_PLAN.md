# Owino — Product Redesign & Production Readiness Plan

**Document type:** Product UX/UI redesign, engineering audit, and implementation roadmap  
**Product:** Owino (FairShare) — smart expense splitting  
**Repository:** https://github.com/vatsal3030/Expense-Tracker  
**Status:** Planning and screenshot-based preliminary audit  
**Important:** This document is based on the supplied requirements and UI screenshots. The repository source code has not been inspected, so implementation status for backend, routing, security, DevOps, and deployment remains unverified.

---

## 1. Product direction

Owino should feel like a trustworthy, polished FinTech SaaS product for people sharing expenses with friends, roommates, families, and travel groups.

The product should prioritize:

1. Financial correctness and clear ownership of money.
2. Fast, predictable navigation.
3. Simple expense entry and understandable settlements.
4. Clear information hierarchy with low cognitive load.
5. Consistent visual design across every route.
6. Responsive, accessible, and reliable interactions.
7. Production-minded security, observability, and deployment.

The goal is not to add visual decoration everywhere. Every component, animation, metric, and notification should help users understand or complete a task.

### Product principles

- **Trust before decoration:** amounts, participants, payers, split rules, and settlement status must be unambiguous.
- **Clarity over density:** show the most useful information first; reveal secondary details progressively.
- **Consistency over novelty:** shared components and predictable layouts across all routes.
- **Fast by default:** route changes should not trigger unnecessary full-page reloads or repeated data fetching.
- **Honest financial states:** never show a success state until the server confirms the operation.
- **Useful empty states:** explain why a section is empty and offer the next relevant action.
- **Progressive enhancement:** core expense and settlement workflows must work without decorative animation.

---

## 2. Screenshot-based UI audit

The following observations are visible in the supplied screenshots. They are design observations, not proof of implementation defects.

| Screen | Current observation | Recommended change |
|---|---|---|
| Dashboard | Several large metric cards compete for attention; chart areas are visually empty when there is no data | Prioritize net balance, you owe, owed to you, and recent activity; use meaningful empty chart states |
| Expenses | Large empty panel and basic category filter | Improve filter hierarchy, transaction list/table, add-expense entry, and empty-state guidance |
| Groups | Single group card is isolated in a large unused canvas | Use a consistent page grid, clearer group summaries, member avatars, balances, and recent activity |
| Group detail | Members, balances, and recent expenses are presented in separate panels | Establish a repeatable group-detail layout and clearer group-level actions |
| Analytics | Several zero-value metrics and empty charts dominate the screen | Explain insufficient data, avoid misleading metrics, and make chart labels/tooltips useful |
| FairScore | Strong visual emphasis on score, tier, streak, and factor cards | Explain how scores are calculated; avoid implying financial creditworthiness or guarantees |
| Settlements | Empty state is large and offers little next-step context | Explain that settlements appear when balances exist; guide users to record/confirm a payment |
| Global navigation | Sidebar is persistent but dense; selected states and icon treatments need refinement | Standardize navigation spacing, icons, active state, responsive collapse, and keyboard behavior |
| Global header | Search, rewards, theme, notifications, and profile compete for attention | Clarify priority and group secondary actions |
| Global styling | Many near-black panels, borders, and green accents create a repetitive surface treatment | Use a deliberate neutral palette, restrained accent color, surface elevation, and semantic colors |

### Main design risks to investigate

- Too many cards with similar visual weight.
- Large empty regions without helpful guidance.
- Inconsistent horizontal padding and content widths between routes.
- Green used for decoration as well as positive financial meaning.
- Reward/FairScore elements competing with core money information.
- Charts that appear broken or meaningless when the user has no data.
- Small or low-contrast labels.
- Generic iconography and inconsistent icon stroke/size.
- Repeated page-level loading rather than localized loading.
- Layout shifts while data is loading.

---

## 3. Recommended visual design system

### 3.1 Brand direction

Retain the **Owino** name and existing product identity unless product research gives a strong reason to change it.

Recommended visual personality:

- Calm, confident, precise, human, and modern.
- More private-banking / premium productivity than crypto dashboard.
- Restrained use of green, with warm neutral surfaces and clear typography.
- Avoid gradients as a default background treatment.
- Avoid glowing borders, excessive glassmorphism, random colored cards, and decorative chart noise.

### 3.2 Color tokens

Use semantic design tokens rather than hard-coded colors in individual components.

Suggested starting palette (validate contrast before release):

| Token | Light theme | Dark theme | Usage |
|---|---|---|---|
| App background | `#F6F7F5` | `#101412` | Main application canvas |
| Surface | `#FFFFFF` | `#171C19` | Cards and panels |
| Raised surface | `#FAFBF9` | `#1D2420` | Menus, dialogs, raised panels |
| Primary text | `#18211C` | `#F2F5F2` | Headings and important content |
| Secondary text | `#66716A` | `#A5B0A8` | Supporting labels |
| Border | `#E3E8E3` | `#2B342E` | Separation and control outlines |
| Primary accent | `#087F5B` | `#35B98A` | Primary actions and selected navigation |
| Accent subtle | `#E7F4EE` | `#18352A` | Selected/soft accent surfaces |
| Danger | `#C43D45` | `#F0787D` | Failed payments, negative balances |
| Warning | `#A96B16` | `#E8B45D` | Pending or attention states |
| Information | `#3569A8` | `#80AEEA` | Informational states |

Rules:
- Positive/negative colors must communicate meaning, not merely decorate cards.
- Do not rely on color alone; pair status colors with text and icons.
- Define tokens centrally and use them across every page.
- Check WCAG contrast, including muted text, badges, borders, and focus indicators.
- Theme switching must preserve semantic meaning and component contrast.

### 3.3 Typography

Choose one highly readable sans-serif family and use a consistent type scale. For example, use Inter or Geist, subject to the current stack and licensing.

Suggested hierarchy:
- Page title: 26–30 px, semibold.
- Section title: 18–20 px, semibold.
- Card title: 14–15 px, medium.
- Body: 14–16 px, regular.
- Supporting text: 12–13 px, with accessible contrast.
- Financial amount: 26–32 px for primary balance; 18–22 px for secondary amounts.

Use tabular numerals for monetary values so amounts align visually. Format currency consistently, including the user's currency and locale.

### 3.4 Spacing, layout, and shape

Adopt a consistent 4 px base spacing scale. Use a small, deliberate radius system, for example:
- Small controls: 8 px.
- Standard cards: 12–16 px.
- Large containers/dialogs: 16–20 px.
- Pills: fully rounded only where semantically appropriate.

Recommended desktop shell:
- Fixed or sticky sidebar with a consistent width.
- Stable top header.
- Main content with a consistent maximum width and page padding.
- Reusable page header: title, short description, primary action.
- Standard section spacing and grid breakpoints.

Avoid individually positioning cards to fill empty space. Use a consistent responsive grid.

### 3.5 Icons

Use one icon family consistently, such as Lucide, or a carefully selected premium icon set if the license permits. Keep stroke width, size, alignment, and visual weight consistent.

Use:
- 18–20 px for navigation and standard controls.
- 16 px for inline actions.
- 20–24 px for empty-state illustrations where appropriate.

Do not mix emoji, filled icons, outlined icons, and unrelated icon packs in the same navigation system. Decorative icons should never replace labels for important financial states.

---

## 4. Information architecture and page layouts

### Global application shell

Every authenticated page should share:
- Sidebar/navigation.
- Header with search, notifications, theme, and profile.
- Main content container.
- Consistent page title/action row.
- Toast/feedback region.
- Dialog and command-menu layer.
- Responsive mobile navigation.

### Dashboard

Primary purpose: answer “Where do I stand financially?” quickly.

Recommended order:
1. Page heading and primary actions.
2. Net balance, you owe, owed to you, and monthly spending.
3. Settlement or outstanding-balance action when relevant.
4. Spending trend and category breakdown.
5. Recent expenses and group activity.

Do not show fabricated or misleading analytics when there is no data. Use a clear first-use state and explain how to create the first expense.

### Expenses

Primary purpose: find and manage transactions.

Recommended layout:
1. Page title and Add Expense action.
2. Search and filters (date, group, category, payer, participant).
3. Expense list with date, description, category, payer, group, total, and status.
4. Pagination or progressive loading if the list becomes large.
5. Expense detail view with split breakdown, receipt, edits, and audit history where supported.

### Groups

Primary purpose: organize shared spending.

Recommended layout:
- Page title and Create Group action.
- Search/filter if groups become numerous.
- Group cards with name, member avatars, total activity, and current user's net position.
- Useful empty state with a Create Group action.

### Group detail

Use a stable tab structure:
- Overview
- Expenses
- Balances
- Members
- Activity / settings

Keep group identity and core actions visible. Make each balance explain who owes whom and why.

### Settlements

Show:
- Pending payments.
- Payments awaiting confirmation.
- Confirmed settlement history.
- Clear payer, receiver, amount, date, and status.
- Record payment / confirm / reject actions only where authorized.

A settlement must not be marked complete merely because a user clicked a button. Persist the operation and display the server-confirmed result.

### Analytics

- Provide date ranges with clear labels.
- Use accessible charts with axes, legends, tooltips, and textual summaries.
- Do not render empty chart canvases as if data exists.
- Explain the data source and calculation period.
- Ensure totals reconcile with the underlying expense records.

### FairScore

Treat this as a product reputation/engagement feature, not a credit score. Clearly explain:
- What affects the score.
- What each factor means.
- How often it updates.
- Whether a displayed tier is a product-defined achievement.
- That it is not a bank, credit bureau, or lending assessment.

If the score is not yet calculated from real persisted data, do not present a fabricated score as real.

### Budgets, Friends, Activity, Settings

Create consistent page templates and shared interaction patterns. Do not allow secondary modules to have a different design language from core expense pages.

---

## 5. Interaction, animation, and loading experience

Animations should communicate state or provide feedback. They should not delay financial tasks.

### Loading strategy

Use the smallest loading scope possible:
- Initial application load: branded Owino loader if needed.
- Route data load: page skeleton matching the final layout.
- Button submission: inline spinner and disabled state.
- Chart load: chart skeleton inside the chart container.
- Background refresh: subtle non-blocking indicator.

Avoid showing a full-screen loader for every sidebar navigation click.

### Owino loader concept

A short, restrained financial-product animation:
- A coin or circular balance mark moves into position.
- A split line divides the amount into two balanced portions.
- The two portions settle into place.
- The animation ends quickly and does not loop indefinitely.

Respect `prefers-reduced-motion`. Do not use animation to disguise slow API responses.

### Micro-interactions

Implement consistently:
- Button hover, pressed, focus, disabled, and loading states.
- Sidebar active-state transition.
- Card hover only when the card is interactive.
- Smooth dialog and menu entrance/exit.
- Copy-to-clipboard confirmation.
- Toast feedback for success and errors.
- Form validation near the relevant field.
- Optimistic updates only when rollback and error handling are implemented safely.
- Skeletons that preserve layout dimensions.
- Clear confirmation for destructive actions.

Suggested motion durations:
- Hover/focus: 120–180 ms.
- Small state transition: 160–220 ms.
- Dialog/menu: 180–240 ms.
- Avoid long decorative page transitions.

---

## 6. Routing and navigation performance

These are reported issues and must be investigated in the repository before choosing a fix.

### Required behavior

- Refreshing `/expenses` must remain on `/expenses`.
- Refreshing `/groups/:groupId` must remain on that group detail page.
- Directly opening a valid route must work.
- Browser back and forward must work.
- Unknown routes must show a useful 404 page.
- Protected routes must redirect predictably without losing the intended destination.
- Sidebar navigation must not trigger a full browser reload unless explicitly required.
- Query parameters and relevant filters should survive refresh where appropriate.

### Investigation checklist

1. Identify the routing library and current route definitions.
2. Check whether sidebar items use client-side navigation or ordinary full-page links.
3. Inspect route-level component remounts and shared layout placement.
4. Inspect API calls triggered on every route change.
5. Check for duplicate requests caused by effects or unstable dependencies.
6. Inspect authentication/session checks and loading gates.
7. Inspect bundle splitting and large route dependencies.
8. Check backend response time separately from frontend transition time.
9. Measure with browser performance tools and network traces.
10. Add route-level error boundaries and useful loading states.

### Acceptance criteria

- No unexpected redirect to the dashboard after refreshing a valid route.
- No full-page reload during ordinary in-app navigation.
- Route transition should feel immediate; define and measure a target after establishing a baseline.
- No duplicate API requests without a clear reason.
- Shared shell should not remount unnecessarily.
- Errors and slow requests should have recoverable states.

---

## 7. Financial correctness and security

This area is more important than visual polish.

### Financial correctness

- Store money as integer minor units (for example, paise) or use a carefully designed decimal strategy. Never use binary floating-point arithmetic as the authoritative money representation.
- Define rounding rules for equal and percentage splits.
- Ensure split totals reconcile exactly to the expense total.
- Handle edits, deletions, refunds, and member removal without corrupting balances.
- Use database transactions for multi-record financial changes.
- Prevent duplicate submissions with idempotency where appropriate.
- Maintain a clear record of who created, edited, confirmed, or deleted a financial record.
- Validate all calculations on the server; never trust frontend totals.
- Test edge cases such as 3-way splits of indivisible amounts, zero values, negative inputs, and concurrent updates.

### Authentication and authorization

- Verify every API request has the correct authenticated user context.
- Enforce group membership and record ownership on the backend.
- Do not rely on hidden frontend buttons as access control.
- Use secure session/token handling and safe cookie settings where applicable.
- Apply rate limits to authentication and OTP endpoints.
- Never log passwords, OTPs, access tokens, or sensitive financial data.

### Database and API

- Use schema validation at API boundaries.
- Add appropriate foreign keys, indexes, unique constraints, and transaction boundaries.
- Validate ownership for nested resources such as group expenses and settlements.
- Use safe error responses without exposing stack traces or secrets.
- Configure CORS narrowly for known frontend origins.
- Protect against mass assignment and unsafe query construction.
- Establish backup and recovery expectations before real users rely on the service.

### Privacy and receipts

- Restrict receipt access to authorized users.
- Validate uploaded file types and sizes.
- Avoid public object URLs for private receipts.
- Define retention and deletion behavior.
- Collect only necessary user information.

---

## 8. Requirements audit

The table below maps the original project brief to the evidence currently available. “Unverified” means the screenshots and prompt do not prove that the requirement is implemented.

| Original requirement | Current evidence | Status | Required action |
|---|---|---|---|
| SaaS-level usable application | Multiple application screens supplied | Partially evidenced | Inspect workflows and source |
| Expense add/edit/delete | Add Expense actions visible; no successful workflow evidence | Unverified | Inspect and test CRUD |
| Expense categories | Category filter visible | Partially evidenced | Verify category persistence and filtering |
| Expense splitting | Product purpose and group/balance UI visible | Unverified | Verify split calculations and API |
| Group management | Groups and group detail screens visible | Partially evidenced | Verify create, invite, edit, leave, delete |
| Balances and settlements | Balance and settlement screens visible | Unverified | Verify ledger and settlement lifecycle |
| Dashboard insights | Dashboard and analytics UI visible | Partially evidenced | Verify calculations against database |
| Authentication | Profile identity visible | Unverified | Audit auth/session implementation |
| React / Next.js frontend | Stack proposed in brief | Unverified | Inspect package and source |
| Express.js backend | Stack proposed in brief | Unverified | Inspect backend services |
| PostgreSQL / Prisma | Stack proposed in brief | Unverified | Inspect schema, migrations, and queries |
| Supabase | Mentioned as an option | Unverified | Confirm whether used and for what |
| Axios/API integration | Mentioned in requested stack | Unverified | Inspect API client and error handling |
| Docker | Required by project brief | Unverified | Inspect Dockerfiles and Compose |
| Microservices | Frontend/backend separation proposed | Unverified | Confirm architecture and service boundaries |
| Terraform | Required by project brief | Unverified | Inspect IaC and state handling |
| Kubernetes / Minikube | Required by project brief | Unverified | Inspect manifests and deployment |
| GitHub Actions CI/CD | Required by project brief | Unverified | Inspect workflows and branch protections |
| DevSecOps: npm audit / Trivy | Required by project brief | Unverified | Inspect and run security scans |
| Vercel frontend | Deployment preference | Unverified | Inspect project deployment configuration |
| Render backend | Deployment preference | Unverified | Inspect service configuration |
| AWS learning deployment | Desired additional deployment | Unverified | Design a cost-controlled AWS learning deployment |
| PWA | Requested option | Unverified | Audit manifest, service worker, installability, offline behavior |
| Dynamic routing and refresh | User reports refresh redirects to default sections | Reported defect | Reproduce and fix |
| Fast navigation | User reports 2–3 second transitions | Reported defect | Profile and optimize |
| Premium, consistent UI | Screenshots show inconsistent visual hierarchy | Needs refinement | Implement design system |
| Meaningful loaders and micro-interactions | No clear evidence of a complete system | Needs audit | Implement scoped loading and feedback |
| Responsive design | Desktop screenshots only | Unverified | Audit tablet and mobile |
| Accessibility | Not established by screenshots | Unverified | Keyboard, contrast, focus, screen-reader audit |
| Public application URL | Not supplied | Unverified | Deploy and verify |
| Push to existing GitHub repository | Repository URL supplied; repository not accessed | Not verified | Inspect access and current branch before pushing |

**Audit conclusion:** The screenshots prove that several product sections have been designed. They do not prove that their underlying workflows, financial calculations, security, DevOps, or deployment requirements are fulfilled. Do not mark these complete until source inspection and evidence-based verification are done.

---

## 9. Recommended implementation phases

Do not redesign everything in one uncontrolled pass. Work in small phases with clear acceptance criteria.

### Phase 0 — Repository and requirements discovery

Tasks:
- Obtain and inspect the current repository.
- Identify frontend, backend, database, routing, state management, and UI libraries.
- Review package scripts, environment variable usage, and deployment configuration.
- Map every requirement to source files and existing behavior.
- Reproduce reported refresh and navigation issues.
- Record current performance baseline.
- Identify existing functionality that must not be broken.

Deliverables:
- Repository architecture map.
- Requirement-to-file matrix.
- Defect list with reproduction steps.
- Current deployment and DevOps inventory.

### Phase 1 — Critical application reliability

Tasks:
- Fix route definitions and refresh behavior.
- Fix direct-link and browser history behavior.
- Investigate navigation latency.
- Remove avoidable full-page reloads and duplicate requests.
- Ensure shared layouts persist across route changes.
- Add route-level loading and error states.

Acceptance:
- Valid routes survive refresh.
- Direct links and browser history work.
- Navigation has no unnecessary document reload.
- No known route redirects unexpectedly.
- Measured transition and API timings are documented.

### Phase 2 — Design system and application shell

Tasks:
- Define semantic color, typography, spacing, radius, shadow, and motion tokens.
- Build consistent sidebar, header, content container, and page header.
- Standardize buttons, inputs, selects, tabs, badges, cards, dialogs, tables, and toasts.
- Standardize icons.
- Implement coherent light and dark themes.
- Add responsive navigation behavior.

Acceptance:
- All routes use the same design primitives.
- No route uses arbitrary one-off spacing or colors without a reason.
- Keyboard focus and disabled/loading states are visible.
- Theme changes preserve readable contrast.

### Phase 3 — Core product screens

Recommended order:
1. Dashboard.
2. Expenses and expense details.
3. Groups and group details.
4. Balances and settlements.
5. Friends and invitations.
6. Activity.
7. Budgets.
8. Analytics.
9. FairScore.
10. Settings and profile.

Acceptance:
- Each page has a clear primary action.
- Empty, loading, error, and populated states are designed.
- Data labels and financial statuses are consistent.
- Responsive layouts are defined.
- Existing working behavior is preserved.

### Phase 4 — Financial correctness and security

Tasks:
- Audit money representation and rounding.
- Verify server-side split and balance calculations.
- Add transaction boundaries and idempotency where needed.
- Verify ownership and group-membership checks.
- Audit auth, CORS, rate limits, validation, receipt storage, and logging.
- Add tests for financial edge cases and unauthorized access.

Acceptance:
- Split totals reconcile exactly.
- Unauthorized users cannot read or modify another user's records.
- Duplicate submissions do not create duplicate financial records.
- Financial mutations are atomic and auditable.

### Phase 5 — Product interactions and PWA

Tasks:
- Add branded loading animation and local skeletons.
- Add consistent toasts, confirmations, and form feedback.
- Add reduced-motion support.
- Add PWA manifest, icons, install behavior, and carefully scoped service worker.
- Define offline behavior explicitly; do not imply that unsettled financial mutations are safely synchronized offline unless implemented.

Acceptance:
- No decorative loader blocks normal interaction unnecessarily.
- PWA installability is verified.
- Offline states are honest and recoverable.
- Core actions provide clear success/error feedback.

### Phase 6 — DevOps and deployment

Tasks:
- Verify Dockerfiles and local Docker Compose workflow.
- Build GitHub Actions for linting, tests, builds, and security checks.
- Add npm audit and Trivy scans with documented severity policy.
- Build Terraform configuration for the agreed infrastructure.
- Add Kubernetes manifests/Helm only if justified by project requirements.
- Configure Vercel frontend and Render backend if retaining the requested free-tier path.
- Plan a separate AWS learning deployment with budget alerts and resource cleanup.
- Add health checks, logs, and deployment documentation.

Acceptance:
- A clean clone can be built using documented commands.
- CI fails on required checks.
- Secrets are stored in environment/secret managers, not committed.
- Deployment and rollback steps are documented.
- AWS resources and expected costs are understood before provisioning.

### Phase 7 — Release readiness

Tasks:
- Run functional, security, responsive, accessibility, and performance checks.
- Verify production environment variables and database migrations.
- Verify error handling, monitoring, backup, and recovery.
- Prepare README, architecture diagram, screenshots, and demo walkthrough.
- Verify public URL and PWA behavior.

Acceptance:
- No known critical financial/security defects.
- All core flows pass documented checks.
- Production deployment can be reproduced.
- Project showcase accurately describes what is implemented.

---

## 10. Suggested repository organization

This is a target structure, not a claim about the existing repository. Adapt it after inspection rather than moving files blindly.

```text
owino/
├── apps/
│   ├── web/                 # React/Next.js frontend
│   └── api/                 # Express API
├── packages/
│   ├── ui/                  # Shared UI components, if monorepo is justified
│   ├── config/              # Shared lint/TypeScript configuration
│   └── shared/              # Shared schemas/types
├── infra/
│   ├── terraform/
│   └── kubernetes/
├── .github/
│   └── workflows/
├── docs/
│   ├── architecture.md
│   ├── requirements-audit.md
│   ├── deployment.md
│   └── security.md
├── docker-compose.yml
└── README.md
```

Do not introduce a monorepo or additional abstraction unless the current project structure benefits from it. Keep service boundaries understandable and demonstrable.

---

## 11. Technology and hosting decisions

The original brief proposes:
- Frontend: React or Next.js, deployed on Vercel.
- Backend: Express.js, deployed on Render.
- Database: PostgreSQL with Prisma; Supabase may provide managed PostgreSQL/auth/storage depending on the final architecture.
- HTTP client: Axios or an equivalent centralized API client.
- UI: one consistent component library/design system.
- DevOps: Docker, Terraform, Kubernetes, GitHub Actions, npm audit, and Trivy.
- PWA support.
- AWS deployment for learning and demonstration.

Important decisions to make after repository inspection:
1. Choose React/Vite or Next.js based on current architecture and actual needs; do not migrate solely for fashion.
2. Avoid duplicating authentication responsibilities between Supabase Auth and custom Express authentication without a clear reason.
3. Decide whether Supabase is only PostgreSQL hosting or also auth/storage.
4. Keep the API as the authoritative layer for financial calculations and authorization.
5. Treat Vercel/Render as the practical initial deployment path and AWS as a separate learning deployment if that fits the assignment.
6. Check current free-tier limits and usage policies before promising that every service can remain free. Cloud credits and free tiers can expire or incur charges.

---

## 12. Performance and quality measurements

Capture a baseline before optimization, then compare after each relevant phase.

Measure:
- Route transition time.
- API request duration.
- Number of requests per route change.
- JavaScript bundle size.
- Largest Contentful Paint (LCP).
- Interaction to Next Paint (INP).
- Cumulative Layout Shift (CLS).
- Error rate and failed requests.
- Database query duration for key operations.

Quality gates:
- No repeated full-document navigation for internal routes.
- No avoidable duplicate API requests.
- No layout shift caused by missing image/card dimensions.
- No unhandled promise rejection in core flows.
- No sensitive values in logs.
- No broken mobile navigation.
- No financial action shown as successful before server confirmation.

---

## 13. What is needed before actual code implementation

The supplied screenshots and written brief are enough to create this plan and a preliminary visual audit. They are not enough to safely modify the application.

**Next required input:** upload the current repository as a ZIP, or provide the relevant source files. Exclude:
- `.env` files.
- API keys, passwords, tokens, and private certificates.
- `node_modules`.
- Build output and cache directories.

Keep:
- Frontend source and package files.
- Backend source and package files.
- Prisma schema and migrations.
- Docker and Compose files.
- Terraform and Kubernetes files.
- GitHub Actions workflows.
- README and deployment configuration.
- Example environment files with placeholder values only.

The GitHub repository URL is known, but repository access and push permissions have not been verified. Do not assume changes have been pushed. Once source and access are available, inspect the actual implementation, preserve working features, make changes in phases, and report exactly what was changed and what remains.

---

## 14. Immediate next steps

1. Share the sanitized repository ZIP.
2. Perform Phase 0 repository discovery.
3. Produce a verified requirement audit with file paths and evidence.
4. Fix routing and navigation performance before broad visual changes.
5. Establish the design system and shared application shell.
6. Redesign the dashboard and core expense workflows.
7. Continue through financial correctness, security, PWA, DevOps, and deployment phases.

**Final product standard:** Owino should look calm and premium, make every financial relationship understandable, respond quickly, protect user data, and be deployable from a documented workflow. The implementation should be evidence-driven: no requirement is considered complete merely because a screen or button exists.
