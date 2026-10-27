# DevSecOps & OWASP Financial Security Rules

These rules enforce strict security engineering standards across all contributions to Owino/FairShare.

## 1. Zero Secret Exposure
- **Never commit secrets, API keys, passwords, private keys, or session tokens.**
- Any file ending in `.pem`, `.key`, `.p12`, or `.env*` (except `.env.example`) must remain in `.gitignore`.
- Docker Compose, Helm charts, and Terraform manifests must NEVER contain plaintext fallback passwords or API keys. Always use variable substitution (`${VARIABLE_NAME}`).
- Before submitting work, verify no secrets are introduced using GitLeaks patterns.

## 2. Authorization & Insecure Direct Object References (IDOR)
- Every route handling private entities (expenses, groups, settlements, budgets) MUST verify that the authenticated user (`req.user.id`) is an active member or owner of that entity.
- Example: Never query `prisma.expense.findUnique({ where: { id } })` without checking that `expense.paidById === user.id` OR `expense.shares.some(s => s.userId === user.id)` OR the user belongs to the associated group.
- Group operations (invite, remove, archive) require verifying `role === 'ADMIN'` in `GroupMember`.

## 3. Financial Integrity & Precision
- Never use floating-point numbers (`0.1 + 0.2 === 0.30000000000000004`) for split calculations.
- Always use integer math (in cents/paise) or `Prisma.Decimal` / `BigNumber` for balance calculations and settlement graphs.
- Total expense shares MUST equal the total expense amount down to the exact cent (`sum(shares) === totalAmount`).
- Verify that debt minimization retains zero-sum conservation of net balances (`sum(netBalances) === 0`).

## 4. Input Sanitization & Attack Mitigation
- Protect all database interactions via Prisma ORM parameterized queries. Never construct raw SQL strings (`prisma.$queryRawUnsafe`) with unescaped user inputs.
- All user-supplied string fields (descriptions, group names, notes) must be trimmed and validated against regex constraints to block XSS and script injection.
- Keep `helmet` and `cors` headers properly configured; do not allow `Access-Control-Allow-Origin: *` in production when credentials are included.
- Maintain rate limits on auth and transaction routes to prevent brute-force and denial-of-wallet attacks.
