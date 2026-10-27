# Reusable Workflow: Documentation Generation & Sync

**Pattern:** Continuous Architecture & API Documentation  
**Goal:** Generate, synchronize, and maintain accurate technical documentation, API contracts, and runbooks directly from code.

---

## Step 1: Scan for Schema & Route Changes
1. Inspect Git diff since the last release:
   - Were new models or fields added to `server/prisma/schema.prisma`?
   - Were new routes, parameters, or payloads added in `server/src/routes/`?
   - Were environment variables added or deprecated in `.env.example`?

---

## Step 2: Extract API Specifications & Contracts
1. For every updated route:
   - Extract the HTTP method and URI path.
   - Extract required headers (`Authorization`, `Idempotency-Key`).
   - Extract Zod schema definitions for request body and query parameters.
   - Extract expected response structure and error codes.
2. Update the API Reference documentation in `docs/` or `README.md`.

---

## Step 3: Update Architecture & Flow Diagrams
1. If service routing or infrastructure changes:
   - Update Mermaid diagrams in `DEVOPS_ARCHITECTURE_AND_VIVA_GUIDE.md`.
   - Update network flows in `docker-compose.prod.yml` and `nginx/nginx.conf` documentation.

---

## Step 4: Verify Formatting & Links
1. Ensure all file paths and symbols use clickable markdown links (`file:///...`).
2. Verify table formatting and code snippet syntax highlighting.
3. Validate that instructions match the actual working code without theoretical discrepancies.

---

## Step 5: Deliverables
- **Expected Output:**
  - Synchronized README / API reference documentation.
  - Verified Mermaid architecture diagrams.
