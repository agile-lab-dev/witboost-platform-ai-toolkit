---
name: witboost-tech-adapter
description: "Create, assess, design, evolve, review, implement, and test Witboost tech adapters in standalone repositories or a configured Witboost workspace."
argument-hint: "Identify the target tech adapter or say that one must be created, then describe the platform and requested capability or issue."
---

# Witboost Tech Adapter

## Repository Context

- If the current Git repository contains Tech Adapter evidence, use it directly as the target.
- Otherwise, when the current directory is a configured Witboost workspace, locate the target under `tech-adapters/`.
- Otherwise, ask for the target repository path.
- A configured workspace is required only for Create, discovery among multiple repositories, or cross-entity work involving templates or policies.
- Identify one target repository before reading or changing adapter behavior.
- Create and Assess are operations selected from observable repository state, not permanent repository modes.
- This domain pack is self-contained. Use `witboost-toolkit` only when the target entity is not known yet or the work spans multiple entity types.

## Reference Routing

Use progressive disclosure. Do not load every reference and asset for every task.

### Repository Context

- [Tech adapter repository contract](./references/foundations/tech-adapter-repository-contract.md)

Read the [Tech adapter lifecycle contract](./references/foundations/tech-adapter-lifecycle-contract.md) for protocol-sensitive design, assessment, review, implementation, or validation. Skip it for repository creation alone.

Before protocol-sensitive work, determine the installed Witboost version and authoritative Tech Adapter OpenAPI from repository or deployment evidence. If the target uses an older version and its local documentation/OpenAPI URL is unavailable, ask the user for it before making protocol claims. Treat public docs as the latest-version fallback only.

### Read By Phase

- Create a tech adapter: [Create playbook](./references/playbooks/create-tech-adapter.md)
- Reconstruct an existing contract: [Assessment playbook](./references/playbooks/assess.md)
- Establish or extend architecture-level scope before a first or newly scoped feature (recommended, skippable): [High-Level Design playbook](./references/playbooks/high-level-design.md)
- New feature or customization: [New Feature playbook](./references/playbooks/new-feature.md)
- Review: [review playbook](./references/playbooks/review.md)
- Implement: [implementation playbook](./references/playbooks/implement.md)
- Test: [testing playbook](./references/playbooks/test.md)

### Read By Relevant Topic

Each topic is the primary source for its decisions, review signals, and test coverage. Load only the rows triggered by the request or evidence.

| Trigger | Read | Also read when |
| --- | --- | --- |
| Provider resource names, IDs, scopes, collisions, lookup, or migration | [Resource identity and naming](./references/topics/resource-identity-and-naming.md) | Load [Witboost resource identity profile](./references/topics/witboost-resource-identity.md) whenever identity derives from Data Product/component fields or versions. |
| Descriptor fields, configuration, defaults, target mapping, validation, or secret references | [Descriptor versus adapter configuration](./references/topics/descriptor-vs-configuration.md) | Load [Connectivity](./references/topics/connectivity.md) for physical target, credential, network, or deadline behavior. |
| Sync/async mode, `202`, status, termination, task storage, workers, or restart | [Sync versus async](./references/topics/sync-vs-async.md) | Load [Idempotency and retries](./references/topics/idempotency-and-retries.md) for retry, duplicate, partial failure, or recovery behavior. |
| Repeated/concurrent requests, provider retry, race, partial failure, replacement, or compensation | [Idempotency and retries](./references/topics/idempotency-and-retries.md) | Load [Sync versus async](./references/topics/sync-vs-async.md) when the action returns a token. |
| `updateAcl`, `refs`, consumer access, principal mapping, grant removal, or protected grants | [Update ACL and access grants](./references/topics/update-acl-and-access-grants.md) | Load identity for resource lookup and idempotency for retry/concurrency. |
| `unprovision`, `removeData`, shared resources, retention, deletion, purge, or recreate | [Teardown and recreate safety](./references/topics/teardown-and-recreate-safety.md) | Load identity for ownership/name reuse and ACL when access must be restored. |
| Reverse provisioning, importing existing resources, `params`, `catalogInfo`, or descriptor `updates` | [Reverse provisioning](./references/topics/reverse-provisioning.md) | Load descriptor/configuration for field authority, identity for resource matching, and sync/async when returning `202`. |
| Endpoint/account resolution, authentication, TLS, network, proxy, deadline, or provider client | [Connectivity](./references/topics/connectivity.md) | Load descriptor/configuration for authority and idempotency for retry policy. |
| Lifecycle result/status fields, diagnostic logs, audit, PII, correlation, metrics, traces, or health | [Observability](./references/topics/observability.md) | Load sync/async for task retention and ACL for principal audit. |
| Workload template generates build/publication CI/CD | [Workload artifact producer contract](./references/topics/workload-artifact-producer-contract.md) | Treat as upstream evidence; route producer changes to template or cross-entity work. |
| Adapter resolves, verifies, stages, builds through a provider, or deploys a workload release | [Workload artifact consumer contract](./references/topics/workload-artifact-consumer-contract.md) | Read producer contract first and idempotency for retry/rollback. |

### Use By Deliverable

- [Decision log entry](./assets/decision-log-entry.md) for one cohesive accepted decision. Proposals remain in working documents. Every accepted architectural decision updates both `docs/HLD.md` and the append-only decision log.
- [Creation result](./assets/creation-result.md) after creating a repository
- [Assessment report](./assets/assessment-report.md) when reconstructing a contract
- [High-Level Design brief](./assets/high-level-design-brief.md) when establishing or extending architecture-level scope — recommended, skippable
- [Feature design](./assets/feature-design.md) when defining or evolving behavior
- [Test matrix](./assets/test-matrix.md) when designing or recording tests

## Workflow

1. Resolve repository context in this order: current Tech Adapter Git repository, configured workspace `tech-adapters/`, explicit repository path. Run Create when the requested repository does not exist.
2. Read `docs/HLD.md` and `docs/decisions/DECISIONS.md` when present.
3. Run Assessment only when existing behavior is not already documented well enough for the requested work.
4. Recommend the High-Level Design playbook when architecture-level scope is missing; it remains skippable.
5. Perform the requested phase using only the relevant topic references.
6. Assessment may update only the current evidence report at `docs/assessment/ASSESSMENT.md`. Review is read-only. Neither workflow changes HLD, decisions, descriptors, or implementation until the applicable confirmation or acceptance rule is satisfied.
7. When design or evolution produces an accepted architectural decision, update `docs/HLD.md` and append one cohesive entry to `docs/decisions/DECISIONS.md`. Use ID `YYYY-MM-DD-slug`; a replacement entry identifies `Supersedes` without editing prior history. Keep non-architectural detail out of the HLD.
8. Validate against the target repository at the level authorized by the user.

## Authoritative Deliverables By Workflow

Playbooks may make a listed deliverable conditional, but must not introduce another mandatory artifact without adding it here.

### Create

- Chosen language, exact toolkit release, and exact sanitized CLI command
- Scaffold repository URL and immutable commit
- Created repository path, provenance file, independent Git history, and structural check result
- Follow-on work only when requested

### Assess

- Current scoped assessment persisted to `docs/assessment/ASSESSMENT.md`
- Target repository inventory limited to the requested scope
- Installed-version Tech Adapter API baseline and capability/evidence matrix
- Actual versus expected contract gaps and required test coverage deltas
- Repository invariant: one confirmed valid, realistic internal descriptor at `docs/reference-descriptors/<kind>.yaml` for every supported component kind. A targeted assessment verifies only in-scope kinds, marks others as not verified, and drafts missing or changed in-scope descriptors for confirmation before writing

### High-Level Design

- Adapter-specific overview and component mapping
- Lifecycle coverage table listing which operations are in scope
- Conceptual narrative and requirements per in-scope operation
- Open sections explicitly listed when scope is not yet fully defined
- `docs/HLD.md` and decision log updated after each accepted architectural decision

### New Feature

- Desired behavior and compatibility boundary
- Affected ownership and integration boundaries
- Accepted decisions and open proposals kept distinct
- Lifecycle map only when lifecycle actions or support endpoints change
- Each accepted durable decision appended as one cohesive entry to `docs/decisions/DECISIONS.md`
- HLD updated when an accepted decision changes architecture-level scope
- Test impact and required coverage; use the full test matrix when scenarios need to be designed or recorded

### Review

- Findings ordered by severity
- Missing decisions
- Missing tests
- Compatibility risks

### Implement

- Smallest viable patch set
- Focused validation after the first edit
- Follow-up gaps if the repo does not support full verification

### Test

- Exact reproducible requests used, with credentials and reusable tokens redacted
- Named environment and execution mode
- Status polling path for async actions
- Observed result
- Cleanup result for side-effecting checks
- Gaps that still need target-environment verification
