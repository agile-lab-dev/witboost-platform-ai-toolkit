# Teardown And Recreate Safety

## Protocol Contract

Witboost includes the required boolean `removeData` in Tech Adapter validation, provisioning, and unprovisioning requests. The product contract defines `removeData=true` as authorization to delete the component's underlying data when it is undeployed; `false` does not authorize that data deletion.

Source: [Witboost Tech Adapter API](https://docs.witboost.com/docs/apis/extension-points/control-plane/builder/tech-adapter-api), request field `removeData`.

`unprovision` followed by `provision` is not a retry and does not promise automatic restoration of every prior platform detail. Safety is defined through explicit postconditions for each owned resource and state category.

## State Classification

Before implementing or reviewing `unprovision`, classify every affected resource or state element:

| Class | Required postcondition |
| --- | --- |
| Adapter-owned infrastructure | Remove or retain according to the adapter's documented undeploy contract. |
| Underlying component data | Preserve when `removeData=false`; delete only when `removeData=true` and the target contract identifies it as component data. |
| Shared or externally owned resource | Preserve; detach only adapter-owned bindings when needed. |
| Adapter-managed state required after recreate | Persist enough non-secret evidence or deterministically reconstruct it. |
| Consumer grants managed by `updateAcl` | Preserve only if the target resource survives; otherwise require a fresh Witboost snapshot after recreation. |
| Operator-managed configuration | Preserve with the resource or declare it outside recreation guarantees before destructive execution. |
| Provider-retained or soft-deleted state | Observe provider retention and name-reuse rules before reporting a successful independent recreation (see [Resource Identity And Naming](./resource-identity-and-naming.md)). |

`removeData=true` authorizes deletion of underlying data; it does not transfer ownership of unrelated shared resources, external grants, backups, legal holds, or operator-managed configuration to the adapter.

## Design Decisions

For every destructive path, define:

1. Which concrete resources and data are adapter-owned, shared, or external.
2. What `removeData=false` preserves and what infrastructure may still be removed.
3. What additional data is deleted when `removeData=true`.
4. Whether backups, retention policies, legal holds, provider locks, or dependency checks can block deletion.
5. How partial deletion is reported and safely retried.
6. Whether deletion is synchronous, asynchronous, soft-delete, or eventually purged.
7. Which identifiers and deployment evidence are needed to avoid deleting another deployment's resource.
8. What `provision` reconstructs and what requires a later orchestration step such as `updateAcl`.
9. Whether a name can be reused immediately or only after provider retention expires.

Documentation alone is not authorization to delete underlying data. The implementation must inspect and honor `removeData` from the Witboost request.

When an agent or developer executes an unprovision test against a real target, `removeData=true` additionally requires explicit confirmation of the named environment, isolated test resources, cleanup expectations, and accepted data loss. That execution safeguard is separate from the adapter's runtime handling of a request already authorized by Witboost.

## Recreate Contract

Define recreation as observable outcomes rather than a blanket parity promise:

- adapter-owned desired state is reconciled again;
- preserved shared and external state remains intact;
- deleted data is not claimed to be recoverable unless a restore contract exists;
- protected provider identifiers or soft-deleted names are handled explicitly;
- access grants are not assumed to reappear when their target was deleted;
- missing operator-managed state is reported as outside the recreation guarantee rather than silently ignored;
- the result identifies any required follow-up operation.

An existence check alone is insufficient. A recreated resource can exist while being incomplete, attached to stale state, or missing required follow-up reconciliation.

## Review Signals

- Is every affected resource classified by ownership and data semantics?
- Can `removeData=false` reach a code path that deletes underlying data?
- Can `removeData=true` delete shared, external, retained, or legally protected state outside its authority?
- Does the adapter verify resource ownership before deletion?
- Are dependency, backup, retention, soft-delete, and purge behaviors explicit?
- Are partial deletions and asynchronous deletion observable and retryable?
- Does recreation distinguish reconstructed state from follow-up operations and unsupported restoration?
- Are consumer grants restored by a fresh `updateAcl` snapshot when required?
- Can provider name retention make recreation target stale or soft-deleted state?
- Do real-environment destructive tests require explicit environment and data-loss confirmation?

High severity findings include deleting underlying data with `removeData=false`, treating `removeData=true` as authority over shared resources, deleting without ownership verification, or reporting success after an unobserved partial deletion.

## Test Coverage

| Scenario | Required assertion |
| --- | --- |
| Unprovision with `removeData=false` | Underlying data remains; only explicitly removable infrastructure and adapter-owned bindings change. |
| Unprovision with `removeData=true` | Authorized component data is deleted; shared, external, retained, and protected state remains within contract. |
| Shared resource | Resource survives and only adapter-owned state is detached. |
| Wrong ownership identity | Deletion is rejected before mutation. |
| Dependency, legal hold, backup, or provider lock | Operation fails or remains pending with an actionable, observable reason. |
| Partial deletion | Failure identifies completed and remaining work; retry converges safely. |
| Soft delete or purge window | Status reflects provider state and recreation does not adopt stale state accidentally. |
| Recreate adapter-owned state | Provision reconstructs the documented desired state using stable identity. |
| Recreate consumer access | A fresh Witboost `updateAcl` snapshot restores managed grants when the target was recreated. |
| Real target destructive test | Named non-production environment, isolated resources, explicit data-loss approval, sanitized evidence, and cleanup outcome are recorded. |
