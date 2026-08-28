---
name: witboost-tech-adapter-ai-toolkit
description: "Develop Witboost tech adapters end to end from a dedicated agent repository. Use to start a new tech adapter or attach to an existing tech adapter repository, then define new features, review, customize, implement, or test with template versus descriptor boundaries, deploy/undeploy/validate/updateAcl lifecycle modeling, naming conventions, versioning, sync versus async choices, and local cURL testing."
argument-hint: "Say whether you are starting a new tech adapter or attaching to an existing one, then add the mode, target platform or repo, related template or descriptor, and the feature or issue."
---

# Witboost Tech Adapter AI Toolkit

## When to Use

- Start a new tech adapter by bootstrapping a target repository from the Java or Python Witboost scaffold
- Attach this dedicated repository workflow to an existing (or freshly bootstrapped) tech adapter codebase
- Define a new tech adapter feature
- Review an existing feature or design
- Customize an existing adapter without losing lifecycle correctness
- Implement and test a change locally
- Clarify whether something belongs in the template, descriptor, or adapter configuration

## Reference Routing

Use progressive disclosure. Do not load every reference and asset for every task.

### Always Read

- [Repository model](./references/foundations/repository-model.md)
- [Lifecycle contract](./references/foundations/lifecycle-contract.md)

### Read By Phase

- New adapter: [bootstrap playbook](./references/playbooks/bootstrap.md)
- Attach existing adapter: [attach playbook](./references/playbooks/attach.md)
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

- [Decision log entry](./assets/decision-log-entry.md) at the end of every attach, new feature, review, or customize session — even when open topics remain. Open questions are a reason to record them explicitly, never a reason to skip persistence.
- [New adapter brief](./assets/new-adapter-brief.md) when bootstrapping
- [Attach report](./assets/attach-report.md) when reconstructing a contract
- [High-Level Design brief](./assets/high-level-design-brief.md) when establishing or extending architecture-level scope — recommended, skippable
- [Test matrix](./assets/test-matrix.md) when designing or recording tests

## Workflow

1. Establish repository mode. Either way, the tech adapter lives in its own target repository, never in this dedicated agent repository.
2. If this is `new adapter`, follow the bootstrap playbook and then continue exactly as `attach existing adapter` against the new repository.
3. If this is `attach existing adapter` (including a freshly bootstrapped repo), inspect the target repository and reconstruct the lifecycle and ownership boundaries from the real routes, scripts, tests, and docs.
4. Read prior locked decisions from `docs/decisions/DECISIONS.md` when it exists.
5. Recommended, skippable: when `docs/HLD.md` does not exist, or does not cover the requested capability or component type, run the High-Level Design playbook to establish or extend it before defining the feature.
6. Select the relevant topics and resolve every open decision that the evidence supports.
7. Perform the requested phase using its playbook and deliverable asset.
8. Before ending the session, persist a decision log entry: lock what is resolved and explicitly record what is still open, with its risk, so the session closes with a well-defined deliverable instead of unrecorded open questions. Only implementation itself must wait for the specific decisions it depends on.
9. Validate against the target repository and report unresolved target-environment gaps.

## Required Deliverables By Mode

### New Adapter

- Chosen language and scaffold repository
- Target repository path and bootstrap confirmation (cloned, history stripped, `.witboost/` copied)
- Then the same deliverables as `Attach Existing Adapter`, against the newly bootstrapped repo

### Attach Existing Adapter

- Target repo inventory
- Reconstructed lifecycle map
- Actual versus expected contract gaps
- Required test coverage deltas
- Decision log entry persisted to `docs/decisions/DECISIONS.md` covering every scanned topic — locked where evidence is conclusive, explicitly open (with its risk) where it is not. This is required to consider the attach analysis concluded, regardless of how many topics remain open.

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