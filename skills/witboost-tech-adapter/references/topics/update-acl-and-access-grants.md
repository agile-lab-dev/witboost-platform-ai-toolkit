# Update ACL And Access Grants

## Protocol Contract

The Witboost Tech Adapter API defines `updateAcl` as a full snapshot of the identities that must have consumer access to an already provisioned component. Witboost always supplies the complete `refs` list, including identities that already have access. The request is not an append-only list and not an add/remove delta.

Source: [Witboost Tech Adapter API](https://docs.witboost.com/docs/apis/extension-points/control-plane/builder/tech-adapter-api), operation `POST /v1/updateacl`.

The adapter must reconcile the supplied snapshot:

- grant access to requested identities that do not have the managed permission;
- preserve requested identities that already have the managed permission;
- revoke managed consumer grants whose identities are absent from `refs`;

An empty `refs` list means that no consumer identity remains desired. It removes identities previously managed through this ACL contract according to the target platform implementation.

## Ownership Boundary

The distinction between managed consumer grants and protected, inherited, or external grants is a Target Decision and recommendation, not a field-level guarantee expressed by the Tech Adapter OpenAPI.

Keep these concerns separate:

- **ACL scaffolding:** roles, groups, permission containers, and provider objects required to support access. Provisioning may create this scaffolding.
- **Technical grants:** permissions required by the component's runtime identity, owners, or operators. Provisioning may create them when they are part of the deployment contract. They are protected from consumer reconciliation.
- **Consumer grants:** bindings derived from the complete `refs` snapshot. `updateAcl` owns their reconciliation.
- **External grants:** inherited, break-glass, platform-managed, or manually managed permissions outside the adapter's declared ownership. `updateAcl` must preserve them.

The adapter must have reliable provenance for `currentManaged`; it must not infer ownership from role names alone. Use provider metadata, a persisted deployment record, a dedicated managed group, or another target-specific mechanism that distinguishes grants created through this contract.

## Reconciliation

Given current managed grants `[alice, bob]`, protected grant `[dp-owner]`, and requested `refs` `[bob, carol]`:

| Action | Principal |
| --- | --- |
| Preserve | `bob`, `dp-owner` |
| Grant | `carol` |
| Revoke | `alice` |

```text
toGrant  = desiredManaged - currentManaged
toRevoke = currentManaged - desiredManaged
```

Before applying the diff:

1. Resolve the target resource using the adapter's accepted precedence among `provisionInfo`, provider identifiers, descriptor identity, and current configuration. Fail without mutation when available evidence conflicts and the target decision does not define a safe resolution.
2. Validate every `refs` entry using the Witboost `user:` and `group:` formats accepted by the target contract.
3. Authorize the requested principal and permission mapping for the target tenant and component.
4. Resolve stable platform identities without deriving provider IDs through string manipulation.
5. Classify current grants as managed, protected, inherited, denied, or external.
6. Re-read or use provider concurrency controls before mutation when concurrent ACL updates are possible.

`accessControlFields` may refine the requested access according to the configured Access Control Request Template. Treat it as untrusted request input: validate its schema and authorize any requested role or scope. It must not allow arbitrary privilege escalation.

On partial failure, report which actions failed and retain enough non-secret evidence for the same snapshot to converge safely on retry. Retry policy belongs to [Idempotency And Retry Behavior](./idempotency-and-retries.md).

## Unsupported Or Delegated Access

If the target adapter does not implement `updateAcl`, state whether consumer access is unsupported or delegated to another reconciler. Do not reinterpret Witboost's snapshot as a delta. Do not hide consumer bindings inside provisioning unless the product contract for that adapter explicitly delegates access management there.

## Review Signals

- Does the implementation treat `refs` as the complete desired consumer set?
- Does it reconcile additions and removals, including an empty snapshot?
- Can it prove which current grants are managed before revoking them?
- Are technical, inherited, break-glass, denied, and external grants protected?
- Are caller, tenant, principal, role, scope, and `accessControlFields` authorized?
- Does it handle deleted identities, nested groups, provider eventual consistency, and concurrent updates?
- Does it follow the accepted existing-resource lookup decision consistently and reject unresolved conflicts among `provisionInfo`, descriptor identity, provider IDs, and current mapping?
- Can the same snapshot be retried without duplicates, privilege widening, or lost updates?
- Are ordinary diagnostics redacted while protected audit records retain only authorized principal references?
- After teardown and recreation, is the need for Witboost to submit a fresh snapshot explicit?

High severity findings include append-only behavior, treating an empty snapshot as no-op, revoking grants without managed provenance, removing protected grants, cross-tenant resolution, or accepting unauthorized role escalation.

## Test Coverage

| Scenario | Required assertion |
| --- | --- |
| Add and preserve | New requested identity is granted; existing requested identity is unchanged. |
| Remove | Managed identity absent from the new snapshot is revoked. |
| Empty snapshot | All managed consumer grants are revoked and protected grants remain. |
| Retry same snapshot | No duplicate grants or privilege widening; final state is unchanged. |
| Unknown or malformed identity | Actionable failure without destructive mutation. |
| Unauthorized role, scope, or tenant | Request is rejected without granting access or revealing sensitive identity data. |
| External, inherited, denied, or break-glass grant | Grant is classified correctly and not removed as a managed consumer grant. |
| Concurrent snapshots | Implementation prevents or detects lost updates according to the target provider's concurrency model. |
| Partial provider failure | Failed actions are observable and retrying the same snapshot converges. |
| Teardown then recreate | Consumer grants are either preserved by an explicit contract or restored by a fresh Witboost `updateAcl` snapshot; no stale grant is assumed. |

For asynchronous implementations, also verify authorized status polling through the terminal outcome. Sanitize principal data in captured requests, logs, and test evidence.
