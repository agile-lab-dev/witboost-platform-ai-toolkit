# Attach Report

## Target Repositories

- Workflow host repo:
- Target adapter repo:
- Related template repo:

## Reconstructed Contract

- Public routes:
- Local scripts:
- Descriptor source:
- Deployment metadata:
- Status model:

## Lifecycle Mapping

- `validate`:
- `provision` or `deploy`:
- `unprovision` or `undeploy`:
- `updateAcl`:

## Execution Contract

Complete one row for every lifecycle action. Use the [existing adapter sync/async scan](../references/topics/sync-vs-async.md#existing-adapter-scan) and classify observable behavior rather than framework syntax.

| Operation | HTTP result | Work before response | Execution model | Task and provider state | Status and transitions | Deadline, cancellation, and recovery | Evidence |
|---|---|---|---|---|---|---|---|
| `validate` |  |  |  |  |  |  |  |
| `provision` |  |  |  |  |  |  |  |
| `unprovision` |  |  |  |  |  |  |  |
| `updateAcl` |  |  |  |  |  |  |  |

Unresolved execution questions:

-

## Naming Contract

Complete one row for every named platform resource. Use the [existing adapter naming scan](../references/topics/naming-convention.md#existing-adapter-scan) to resolve each column.

| Resource | Lifecycle actions | Authority | Canonical identity and formula | Scope | Provider constraints and normalization | Collision and truncation | Lookup and rename behavior | Evidence |
|---|---|---|---|---|---|---|---|---|
|  |  |  |  |  |  |  |  |  |

Unresolved naming questions:

-

## Workload Artifact Contract

Complete one row for every workload release. Use the [existing adapter artifact scan](../references/topics/workload-artifact-contract.md#existing-adapter-scan) to keep workload CI/CD separate from tech adapter delivery.

| Workload | Release contents | Producer repository and CI/CD | Release authority and coordinates | Registry or source | Integrity and completeness | Staging and activation | Observed release evidence | Retention and cleanup | Evidence |
|---|---|---|---|---|---|---|---|---|---|
|  |  |  |  |  |  |  |  |  |  |

Unresolved artifact questions:

-

## Input Contract

Complete one row for every consumed or derived input. Use the [existing adapter input scan](../references/topics/descriptor-vs-configuration.md#existing-adapter-scan) to resolve each column.

| Input | Consuming actions | Authority and source | Required/default | Validation | Precedence or derivation | Secret handling | Drift behavior | Evidence |
|---|---|---|---|---|---|---|---|---|
|  |  |  |  |  |  |  |  |  |

Unresolved input questions:

-

## ACL Contract

Complete one row for every resource with adapter-managed access. Use the [ACL design decision](../references/topics/update-acl-and-access-grants.md#design-decision) to separate scaffolding, technical grants, managed consumer grants, and protected grants.

| Resource | Scaffolding owner | Grant operation | Principal reference resolution | Managed grants | Protected grants | Removal behavior | Idempotency and recovery | Evidence |
|---|---|---|---|---|---|---|---|---|
|  |  |  |  |  |  |  |  |  |

Unresolved ACL questions:

-

## Idempotency Contract

Complete one row for every lifecycle operation. Use the [existing adapter idempotency scan](../references/topics/idempotency-and-retries.md#existing-adapter-scan) to resolve each column.

| Operation | Stable request/resource key | Reconciliation and race handling | Durable async state | Retryable errors and budget | Partial-failure recovery | Repeat/concurrency evidence |
|---|---|---|---|---|---|---|
| `provision` |  |  |  |  |  |  |
| `unprovision` |  |  |  |  |  |  |
| `updateAcl` |  |  |  |  |  |  |

Unresolved idempotency questions:

-

## Observability Contract

Complete one row for every public lifecycle operation. Use the [existing adapter observability scan](../references/topics/observability.md#existing-adapter-scan) to resolve each column.

| Operation | Admin log sink and context | Witboost endpoint, response fields, and messages | Correlation | Redaction | Optional production telemetry | Evidence |
|---|---|---|---|---|---|---|
| `validate` |  |  |  |  |  |  |
| `provision` |  |  |  |  |  |  |
| `unprovision` |  |  |  |  |  |  |
| `updateAcl` |  |  |  |  |  |  |

Unresolved observability questions:

-

## Actual Versus Expected Gaps

-

## Immediate Review Risks

-
