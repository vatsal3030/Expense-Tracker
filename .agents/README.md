# 🛠️ Antigravity AI-Native Engineering Toolkit for Owino / FairShare

This directory (`.agents/`) contains the local configuration, rules, skills, and reusable workflows that elevate Google Antigravity and pair-programming agents into a disciplined senior engineering team.

---

## Directory Architecture

```text
.agents/
├── README.md                      # This maintenance and lifecycle guide
├── rules/                         # Enforced directory & project rules (always active)
│   ├── architecture-conventions.md# Dual runtime parity, Next.js 16, Prisma & Express rules
│   ├── security.md                # OWASP financial security, secret hygiene & IDOR prevention
│   ├── quality-gates.md           # Ponytail minimalism, red/green TDD & evidence rules
│   └── protected-boundaries.md    # Sensitive subsystems guarded against unapproved edits
├── skills/                        # Progressive disclosure agent skills (invoked on demand)
│   ├── ponytail-minimalism/       # Anti-bloat, reuse-first, minimal surgical diffs
│   ├── systematic-debugging/      # 5-step fault isolation & root-cause analysis
│   ├── test-driven-development/   # Red-Green-Refactor testing for financial algorithms
│   ├── owasp-security-audit/      # OWASP API & ASVS vulnerability checklists
│   ├── ui-ux-design-system/       # FinTech design tokens, contrast & responsive rules
│   ├── code-review-evidence/      # Evidence-based review rules requiring reproduction proof
│   └── e2e-browser-testing/       # Playwright and browser subagent testing runbook
└── workflows/                     # 12 standardized, multi-step engineering procedures
    ├── new-feature.md             # GSD Core 5-phase loop (Discuss -> Plan -> Execute -> Verify -> Ship)
    ├── ui-ux-redesign.md          # Visual hierarchy & responsive audit runbook
    ├── codebase-reverse-engineering.md # Structural dependency & data flow mapping
    ├── systematic-debugging.md    # 5-step debugging lifecycle
    ├── code-review.md             # Quality gates & static analysis review
    ├── performance-optimization.md# Latency, bundle size & cache profiling
    ├── api-testing.md             # Endpoint contracts & dual-mode parity testing
    ├── e2e-browser-testing.md     # Cross-browser & mobile viewport testing
    ├── security-dependency-audit.md # GitLeaks, Trivy & SCA vulnerability scan
    ├── terraform-kubernetes-audit.md # IaC, HPA & resource limit verification
    ├── production-readiness.md    # Operational excellence & go-live checklist
    └── documentation-generation.md# Continuous API reference & architecture sync
```

---

## How It Works in Antigravity

1. **Progressive Disclosure:** Skills use standard YAML frontmatter (`name` and `description`). Antigravity only injects the concise description into the model context during session initialization. The full content of a skill is only read when the agent activates it, saving context tokens.
2. **Rule Enforcement:** Rules in `AGENTS.md` and `.agents/rules/*.md` are discovered automatically by the Language Server as files are opened, enforcing coding styles and safety constraints.
3. **No Heavy Global Binaries:** All workflows and skills are self-contained markdown procedures. No untrusted scripts or background daemons are run.

---

## Updating & Maintaining Skills

To add a new skill:
1. Create a directory `.agents/skills/<skill-name>/`.
2. Add `SKILL.md` with YAML frontmatter:
   ```markdown
   ---
   name: <skill-name>
   description: >-
     Third-person description of what the skill does and when the agent should use it.
   ---
   # Instructions...
   ```
3. Test that the agent discovers and follows the skill when prompted.
