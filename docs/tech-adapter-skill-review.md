# Tech Adapter Skill Deep Review

## Purpose

This document tracks the remediation of the content migrated from the former agent-based setup into `skills/witboost-tech-adapter/`. It is a review backlog, not a normative source for adapter behavior.

Update an item to `resolved` only when its decision is explicit, all affected skill files are aligned, relevant tests pass, and the closure evidence is recorded here.

## Status Values

- `open`: confirmed issue, no approved resolution yet.
- `decision-needed`: implementation is blocked on a product or contract decision.
- `in-progress`: an approved resolution is being implemented.
- `resolved`: closure criteria are satisfied and evidence is recorded.
- `accepted`: risk intentionally retained with rationale.

## Critical Backlog

| ID | Status | Finding | Primary files | Decision required | Closure criteria |
| --- | --- | --- | --- | --- | --- |
| TA-001 | resolved | `updateAcl` mixes authoritative-snapshot and delta semantics, creating unsafe empty-request and removal behavior. | `references/topics/update-acl-and-access-grants.md`, lifecycle foundation, HLD and test assets | Confirmed product contract: Witboost always supplies the complete `refs` snapshot. | Topic defines full-snapshot reconciliation, empty/removal semantics, managed provenance, protected grants, authorization, concurrency, and aligned lifecycle/test guidance. |
| TA-002 | resolved | Re-provisioning parity compares incompatible baselines and can weaken ownership safety. | `references/topics/teardown-and-recreate-safety.md`, lifecycle foundation, ACL and artifact topics | Explicit teardown/recreate postconditions; `removeData` is the Witboost authorization for underlying data deletion. | Topic classifies state by ownership, defines `removeData` behavior, destructive execution safeguards, partial deletion, provider retention, recreation, and follow-up ACL reconciliation. |
| TA-003 | resolved | Assessment, design, evolution, and review mandate repository writes even for analysis-only requests. | `SKILL.md`, assessment/design/evolve/review playbooks, decision and HLD assets | Assessment and review are read-only until a discrepancy is resolved. Agreed architectural decisions automatically update both HLD and decision log; non-architectural decisions stay out of HLD. | Analytical workflows return drafts; inferred behavior cannot become a decision automatically; agreed architectural changes update the current view and rationale together. |
| TA-004 | resolved | Validation/testing can imply destructive provider operations without environment, consent, isolation, cleanup, or cost controls. | validation playbook, test matrix, `SKILL.md` deliverables | Separate design, local execution, target execution, and destructive target execution. Real side effects require a named environment and explicit approval; `removeData=true` requires specific confirmation. | Test design is safe by default; target execution records approval, isolation, cost, resources, cleanup plan, and cleanup result. |
| TA-005 | resolved | Exact requests and credential requirements can leak secrets into responses and persisted artifacts. | validation/design playbooks, HLD and test assets, observability topic | Never retain credentials, secret values, authorization headers, session cookies, or reusable tokens. PII such as user/group identifiers may be retained when needed, subject to repository policy. | Requests remain reproducible after redaction; HLD asks for identities, mechanisms, and scopes rather than credential values. |

## High-Priority Backlog

| ID | Status | Finding | Primary files | Closure criteria |
| --- | --- | --- | --- | --- |
| TA-006 | resolved | Lifecycle intent sets are hardcoded and inconsistent (`status` versus `reverseProvision`, omitted and aliased operations). | lifecycle foundation, HLD/assessment/test assets, naming topic | Installed-version OpenAPI is authoritative; customer-local docs are requested for older installations; lifecycle actions are separate from status/termination support endpoints and use canonical API names. |
| TA-007 | resolved | Evolution asks business questions before reading target evidence and locked decisions. | `references/playbooks/new-feature.md` | Evolution reads API, implementation, tests, HLD, and accepted decisions first, then asks only unresolved business questions. |
| TA-008 | resolved | Assessment expands focused work into every operation and component kind. | assessment and HLD playbooks | Assessment is targeted by default; full-repository assessment is explicit. Reference-descriptor coverage is a global repository invariant, but targeted assessment verifies only in-scope kinds and marks others not verified. |
| TA-009 | resolved | Assessment playbook, deliverables, report, and reference descriptor are not aligned. | `SKILL.md`, assessment playbook/report | Current scoped report is persisted at `docs/assessment/ASSESSMENT.md`; each supported kind must have a confirmed valid, realistic internal descriptor under `docs/reference-descriptors/`; targeted assessments verify in-scope kinds only and missing in-scope descriptors require approval before writing. |
| TA-010 | resolved | Decision logging duplicates policy and conflates observed behavior, inferred intent, proposed decisions, and approvals. | `SKILL.md`, decision asset, playbooks, topics | Assessment observations, feature proposals, and accepted decisions are distinct; only cohesive accepted decisions enter the append-only log. |
| TA-011 | resolved | Decision status vocabulary and entry granularity are inconsistent. | `assets/decision-log-entry.md` | Each entry records one accepted decision with stable `YYYY-MM-DD-slug`; superseding entries reference prior IDs without rewriting history. |
| TA-012 | resolved | Create workflow is not fully version-pinned and lacks explicit preflight/consent. | create playbook and creation asset | Explicit Create intent authorizes creation after preflight; workspace setup requires separate approval; skill and CLI use the same exact release; provenance and optional follow-on are recorded. |
| TA-013 | resolved | Required deliverables contradict playbooks and conditional behavior. | `SKILL.md`, all playbooks/assets | One authoritative workflow-to-deliverable matrix defines mandatory and conditional artifacts; feature design and assessment assets are aligned. |
| TA-014 | resolved | Protocol facts, safety invariants, target decisions, and recommendations use undifferentiated normative language. | lifecycle foundation and every topic | Three categories are defined: Product Contract, Target Decision, Recommendation. Topic section labels map to categories; reviews must identify the category behind a finding. |
| TA-015 | resolved | Repository ownership terms overlap around deployment metadata/information and build contracts/execution. | repository foundation | Descriptor owns portable desired input; adapter owns observed provider results; the template owns component scaffolding and, for workload kinds, also the generated CI/CD contract whose execution builds, tests, packages, and publishes artifacts. Non-workload kinds typically have no artifact pipeline. |

## Topic Backlog

| Topic | Status | Recommended action | Main gaps |
| --- | --- | --- | --- |
| Idempotency and retries | resolved | Kept and corrected | Reconciliation is primary; ledger and request fingerprinting are conditional; operation-key scope, replay policy, absent-resource decision, concurrency, recovery, and one end-to-end retry budget are explicit. |
| Observability | resolved | Rewritten | Preserves two audiences while distinguishing protocol output from administrative diagnostics; adds existing-identifier correlation, protected ACL audit, PII policy, retention, injection, cardinality, and optional operational telemetry. |
| Connectivity | resolved | Rewritten | Technology-neutral intent-to-physical mapping, authentication, TLS/network, deadlines, rotation, error normalization, and security; removed framework examples, universal caching, and independent retry policy. |
| Sync versus async | resolved | Kept and corrected | Installed-version OpenAPI drives modes and states; durable multi-replica handling is recommended for `202`; acceptance/dispatch recovery, authorization, retention, concurrency, backpressure, and shutdown are target decisions. |
| Resource identity and Witboost identity profile | resolved | Split and rewritten | Generic authority/canonicalization/collision/ownership/migration is separate from installed-version Witboost fields and major-version defaults. |
| Descriptor versus configuration | resolved | Kept and corrected | Allows bounded side-effect-free remote validation; separates logical intent and physical mapping; authorizes secret references; existing-resource lookup precedence is a target decision with explicit conflict and migration handling. |
| Workload artifact producer and consumer contracts | resolved | Split and rewritten | Template-owned generated producer process is an upstream checklist for adapter compatibility and routes producer changes to template/cross-entity work; mutable selector behavior is a target decision; reproducible provider-managed builds are supported; digest integrity is sufficient; archive hardening is outside the generic contract. |
| Teardown and recreate safety | resolved | Rewritten | Resolved by TA-002. |
| Update ACL and access grants | resolved | Rewritten | Resolved by TA-001, including caller authorization, managed provenance, concurrency, inheritance/deny, and audit boundaries. |
| Reverse provisioning | resolved | Added minimal dedicated topic | Installed-version request/result/status contract, authorized resource discovery, provider-to-descriptor mapping, no-mutation boundary, ambiguity/conflict handling, and tests. |

## Workflow And Asset Backlog

| Area | Status | Required remediation |
| --- | --- | --- |
| Lifecycle vocabulary | resolved | The installed-version Tech Adapter API defines lifecycle actions; status and termination are support endpoints; workflow vocabulary remains separate from API operations. |
| Standalone repository use | resolved | Repository context resolves current Tech Adapter Git repository first, then workspace `tech-adapters/`, then explicit path; workspace is required only for Create, multi-repository discovery, or cross-entity work. |
| Progressive disclosure | resolved | Added protocol preflight plus trigger/dependency routing for every topic; lifecycle foundation is conditional and creation reads only repository context. |
| Assessment report | resolved | Includes scoped inventory, installed-version API baseline, target-derived capability/evidence matrix, component-kind descriptors, observations, and gaps; persisted as the current report. |
| Decision entry | resolved | One cohesive accepted decision per append-only entry; observations and proposals remain in working documents; supersession uses stable IDs. |
| HLD brief | resolved | Copy-ready output has no skill-relative links and represents support, execution, routes, support endpoints, evidence, and proposed/confirmed/unknown status. |
| Test matrix | resolved | Includes execution mode, environment, approvals, actual result, status, sanitized evidence, and cleanup. |
| Creation result | resolved | Includes exact toolkit release and command, scaffold URL/commit, provenance, structural result, and optional follow-on. |
| Missing assets | resolved | Added feature-design asset; reference descriptors are repository-specific YAML contracts drafted from target evidence and confirmed before writing. |
| Historical scan claims | resolved | Removed unsourced claims and implementation-specific adapter surveys from normative topic guidance. Remaining references to existing adapters are generic workflow wording, not evidence claims. |

## Resolved During Structural Refactor

| Item | Status | Evidence |
| --- | --- | --- |
| Generic repository model duplicated the cross-domain workspace model. | resolved | Replaced by `references/foundations/tech-adapter-repository-contract.md`, focused on adapter ownership and contract recovery. |
| Generic lifecycle foundation duplicated cross-domain actor ownership. | resolved | Replaced by `references/foundations/tech-adapter-lifecycle-contract.md`, focused on runtime lifecycle behavior. Further normative alignment remains tracked by TA-006 and TA-014. |
| Old generated harness copies and phase-agent personas caused drift. | resolved | Canonical content now lives only under `skills/witboost-tech-adapter/`; native agents are thin optional wrappers. |

## Resolution Log

Add one row whenever an item is closed.

| Date | ID/topic | Resolution | Files changed | Validation |
| --- | --- | --- | --- | --- |
| 2026-09-04 | TA-001 / Update ACL | Adopted Witboost's full `refs` snapshot contract; defined managed/protected boundaries, empty snapshot, authorization, concurrency, retry, audit, and tests. | ACL topic, lifecycle foundation, evolve playbook, assessment/test/decision assets | Markdown links, skill tests, and typecheck |
| 2026-09-04 | TA-002 / Teardown and recreate | Replaced ambiguous parity with explicit postconditions; bound underlying data deletion to `removeData=true`; added real-environment destructive-test safeguards. | New teardown topic, lifecycle foundation, ACL/idempotency/naming/artifact topics, assessment/test/decision assets | Markdown links, skill tests, and typecheck |
| 2026-09-04 | TA-003 / Documentation persistence | Made assessment and review read-only by default; agreed architectural decisions update both HLD and decision log; inferred behavior remains a draft until confirmed. | Skill workflow, assessment/design/evolve/review playbooks, HLD and decision assets | Markdown links, skill tests, and typecheck |
| 2026-09-04 | TA-004 / Test execution safety | Split design, local, target, and destructive execution; required named environment, explicit side-effect consent, `removeData=true` confirmation, cost/isolation checks, and cleanup evidence. | Validation playbook, test matrix, skill deliverables, teardown topic | Markdown links, skill tests, and typecheck |
| 2026-09-04 | TA-005 / Evidence redaction | Prohibited persisted credentials and reusable tokens while allowing necessary PII under repository policy; changed HLD requirements to mechanism and scopes. | Validation/design playbooks, HLD/test assets, skill deliverables | Markdown links, skill tests, and typecheck |
| 2026-09-04 | TA-006 | Made the installed-version OpenAPI authoritative, with customer-local documentation for older installations; separated lifecycle actions from status and termination support. | Lifecycle foundation, HLD/assessment assets and design playbook | Markdown links, skill tests, and typecheck |
| 2026-09-04 | TA-007/TA-008 | Made Evolution evidence-first and Assessment targeted by default. | Evolve and assessment playbooks | Markdown links, skill tests, and typecheck |
| 2026-09-04 | TA-009/TA-013 | Aligned authoritative deliverables, persisted current assessment, per-kind confirmed reference descriptors, feature design, and conditional lifecycle/test outputs. | Skill, assessment/evolve playbooks, assessment/feature assets | Markdown links, skill tests, and typecheck |
| 2026-09-04 | TA-010/TA-011 | Adopted one cohesive accepted decision per append-only entry with stable IDs and forward supersession references. | Skill, design/evolve playbooks, decision and feature assets | Markdown links, skill tests, and typecheck |
| 2026-09-04 | TA-012 | Added exact-release CLI invocation, preflight, separate workspace-setup consent, provenance verification, and optional follow-on. | Create playbook and creation asset | Markdown links, skill tests, and typecheck |
| 2026-09-04 | TA-014/TA-015 | Added Product Contract/Target Decision/Recommendation categories and clarified desired input versus observed output. Corrected template ownership: workload templates generate the repository and CI/CD artifact process; non-workload templates typically do not generate artifact pipelines. | Lifecycle and repository foundations, workload artifact topic, assessment and feature assets | Markdown links, skill tests, and typecheck |
| 2026-09-04 | Sync/async and idempotency/retries | Made protocol modes/statuses version-driven; made reconciliation primary without assuming an API idempotency key; centralized retry policy and exposed operation durability/recovery as target decisions with recommendations. | Sync/async, idempotency/retry, and connectivity topics | Markdown links, skill tests, and typecheck |
| 2026-09-04 | Connectivity and observability | Removed runtime-specific connectivity assumptions and universal client caching; separated logical intent from physical mapping; rewrote observability around administrative and Witboost-visible audiences with protected audit and existing correlation identifiers. | Connectivity and observability topics | Markdown links, skill tests, and typecheck |
| 2026-09-04 | Descriptor/configuration and resource identity | Allowed bounded remote validation and authorized secret references; made existing-resource lookup precedence a target decision with conflict/migration handling; split generic naming from Witboost descriptor/version identity. | Descriptor/configuration, resource identity, ACL, Witboost identity profile, teardown topic, and skill routing | Markdown links, skill tests, and typecheck |
| 2026-09-04 | Workload artifact contracts | Split workload-template producer and adapter consumer responsibilities; made mutable selector semantics explicit target decisions; supported reproducible provider-managed builds and digest-based integrity. | Producer/consumer artifact topics and skill routing | Markdown links, skill tests, and typecheck |
| 2026-09-04 | Reverse provisioning | Added a minimal installed-version topic for existing-resource discovery, authorized import, descriptor updates, no-mutation behavior, and dedicated async status. | Reverse-provisioning topic, skill routing, and test matrix | Markdown links, skill tests, and typecheck |
| 2026-09-04 | Standalone repository and historical claims | Added current-repository-first context detection with workspace fallback; removed the requirement that normal work starts at workspace root; confirmed unsourced adapter scan claims are absent. | Skill entry point, repository foundation, assessment playbook, creation asset | Markdown links, skill tests, and typecheck |
