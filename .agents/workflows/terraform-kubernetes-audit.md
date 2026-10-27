# Reusable Workflow: Terraform & Kubernetes Audit

**Pattern:** Infrastructure as Code (IaC) & Cloud-Native Verification  
**Goal:** Verify Kubernetes manifests, autoscaling parameters, resource quotas, and Terraform configurations for drift, security, and stability.

---

## Step 1: Terraform Manifest & Provider Review
1. Inspect `terraform/main.tf`, `variables.tf`, and `outputs.tf`:
   - Verify provider version constraints (`hashicorp/kubernetes ~> 2.30`).
   - Confirm no hardcoded secrets exist in default variable values.
2. Validate syntax and format:
   ```bash
   cd terraform && terraform fmt -check
   cd terraform && terraform validate
   ```
3. Run planned diff generation without applying:
   ```bash
   cd terraform && terraform plan
   ```

---

## Step 2: Kubernetes Resource & Limits Audit
1. Inspect deployment manifests in `k8s/`:
   - `client-deployment.yaml`, `server-deployment.yaml`, and microservice manifests.
2. Check resource requests and limits:
   - Does every container have explicit CPU and memory `requests` and `limits`?
   - Verify memory limits prevent Out-Of-Memory (OOM) killer loops on nodes.
3. Check readiness and liveness probes:
   - Do probes point to `/api/health` or `/health`?
   - Are `initialDelaySeconds`, `timeoutSeconds`, and `periodSeconds` configured to prevent false-positive pod restarts?

---

## Step 3: Horizontal Pod Autoscaler (HPA) Verification
1. Inspect `k8s/hpa.yaml`:
   - Verify minimum replicas (`minReplicas: 2`) and maximum replicas (`maxReplicas: 8-10`).
   - Check scaling metrics (average CPU utilization target e.g., 70-80%).

---

## Step 4: Ingress & Network Security
1. Inspect `k8s/ingress.yaml` and `nginx/nginx.conf`:
   - Verify SSL/TLS termination configuration.
   - Confirm path-based routing rules route traffic cleanly to upstream services.
   - Ensure backend service ports match container definitions.

---

## Step 5: Deliverables
- **Expected Output:**
  - IaC audit summary with resource validation status.
  - Zero unparameterized secrets in Terraform / K8s configs.
  - Verified HPA and resource quota recommendations.
