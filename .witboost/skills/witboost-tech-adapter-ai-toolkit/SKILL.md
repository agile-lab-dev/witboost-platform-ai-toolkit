---
name: witboost-tech-adapter-ai-toolkit
description: "Create, assess, design, review, implement, and test Witboost tech adapters inside a configured workspace, preserving template, descriptor, and adapter ownership boundaries."
argument-hint: "Identify the target tech adapter or say that one must be created, then describe the platform and requested capability or issue."
---

# Witboost Tech Adapter AI Toolkit

## Workspace Contract

- Work from the configured Witboost workspace root.
- Tech adapter repositories live under `tech-adapters/`; template repositories live under `templates/`.
- Identify the target repository before reading or changing adapter behavior.
- Create and Assess are operations selected from observable repository state, not permanent repository modes.

## Reference Routing

Use progressive disclosure. Do not load every reference and asset for every task.

### Always Read

- [Repository model](./references/foundations/repository-model.md)
- [Lifecycle contract](./references/foundations/lifecycle-contract.md)

### Read By Phase

- Create a tech adapter: [Create playbook](./references/playbooks/create-tech-adapter.md)
- Reconstruct an existing contract: [Assessment playbook](./references/playbooks/assess.md)
- Establish or extend architecture-level scope before a first or newly scoped feature (recommended, skippable): [High-Level Design playbook](./references/playbooks/high-level-design.md)
- New feature or customization: [New Feature playbook](./references/playbooks/new-feature.md)
- Review: [review playbook](./references/playbooks/review.md)
- Implement: [implementation playbook](./references/playbooks/implement.md)
- Test: [testing playbook](./references/playbooks/test.md)

### Read By Relevant Topic

Each topic is the single source for its concept, design decision, review signals, and test coverage. Read only the topics implicated by the target repository or requested change.

- [Naming convention](./references/topics/naming-convention.md)
- [Workload artifact contract](./references/topics/workload-artifact-contract.md)
- [Descriptor versus adapter configuration](./references/topics/descriptor-vs-configuration.md)
- [Sync versus async](./references/topics/sync-vs-async.md)
- [Update ACL and access grants](./references/topics/update-acl-and-access-grants.md)
- [Idempotency and retries](./references/topics/idempotency-and-retries.md)
- [Re-provisioning parity](./references/topics/re-provisioning-parity.md)
- [Connectivity to the target technology](./references/topics/connectivity.md)
- [Observability](./references/topics/observability.md)

### Use By Deliverable

- [Decision log entry](./assets/decision-log-entry.md) at the end of every assessment, new feature, review, or customize session.
- [Creation result](./assets/creation-result.md) after creating a repository
- [Assessment report](./assets/assessment-report.md) when reconstructing a contract
- [High-Level Design brief](./assets/high-level-design-brief.md) when establishing or extending architecture-level scope — recommended, skippable
- [Test matrix](./assets/test-matrix.md) when designing or recording tests

## Workflow

1. Identify the target repository under `tech-adapters/`, or run Create when it does not exist.
2. Read `docs/HLD.md` and `docs/decisions/DECISIONS.md` when present.
3. Run Assessment only when existing behavior is not already documented well enough for the requested work.
4. Recommend the High-Level Design playbook when architecture-level scope is missing; it remains skippable.
5. Perform the requested phase using only the relevant topic references.
6. Persist resolved and open decisions, then validate against the target repository.

## Required Deliverables By Operation

### Create

- Chosen language and scaffold repository
- Created repository path and structural check result

### Assess

- Target repo inventory
- Reconstructed lifecycle map
- Actual versus expected contract gaps
- Required test coverage deltas
- Decision log entry persisted to `docs/decisions/DECISIONS.md`

### High-Level Design

- Adapter-specific overview and component mapping
- Lifecycle coverage table listing which operations are in scope
- Conceptual narrative and requirements per in-scope operation
- Open sections explicitly listed when scope is not yet fully defined

### New Feature

- Lifecycle map
- Ownership table
- Decision matrix
- Decision log entry persisted to `docs/decisions/DECISIONS.md` (locked decisions plus any still-open topics)
- Test matrix

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

- Exact requests used
- Status polling path for async actions
- Observed result
- Gaps that still need target-environment verification