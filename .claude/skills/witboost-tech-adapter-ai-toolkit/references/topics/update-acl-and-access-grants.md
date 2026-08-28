# Update ACL And Access Grants

## Concept

`updateAcl` reconciles who can access an already-provisioned component. Treat the request as the **desired state** of consumer grants, not as an append-only list:

- grant access to new principals;
- preserve grants still requested;
- revoke managed grants no longer requested;
- preserve protected grants owned outside `updateAcl`.

Keep two concerns separate:

- **ACL scaffolding** creates groups, roles, RBAC definitions, and permission containers. It belongs to `provision`.
- **Access grants** bind users, groups, service identities, or other data products to that scaffolding. Business and consumer bindings belong to `updateAcl` and must be repeatable without redeploying.

Provisioning may bind technical principals required to operate the resource, such as its service identity or development group. Those grants are protected from consumer reconciliation. The exception must be explicit and must never include business users or data consumers.

### Example

Given current managed grants `[alice, bob]`, protected grant `[dp-owner]`, and requested references `[bob, carol]`:

| Action | Principal |
| --- | --- |
| Preserve | `bob`, `dp-owner` |
| Grant | `carol` |
| Revoke | `alice` |

An empty reference list means “revoke every managed consumer grant”, not “do nothing”.

## Design Decision

For each resource, decide and record:

1. **Target** — how the component and its latest successful provisioning information identify the platform resource.
2. **Authority** — whether the request contains the complete desired set of grants or only a delta. Prefer complete desired state.
3. **Principal mapping** — how stable Witboost references such as `user:alice@example.com` or `group:data-readers` map to platform identities. Do not derive platform IDs by string manipulation.
4. **Permission mapping** — which platform role or privilege each access type receives. Grant the least privilege needed; for example, output-port consumers may receive `SELECT`, not ownership.
5. **Managed boundary** — which grants the adapter may revoke and which technical, owner, inherited, or externally managed grants it must preserve.
6. **Execution model** — default side-effecting or eventually consistent updates to async with status polling. Sync is acceptable only when bounded and justified.
7. **Failure semantics** — validate every principal before mutation when possible. On partial failure, report affected principals and make retries converge safely.

The reconciliation should be set-based and idempotent:

```text
toGrant  = desiredManaged - currentManaged
toRevoke = currentManaged - desiredManaged
```

Use the same resource resolver and naming rules as `provision`, `status`, and `unprovision`. Never log credentials or sensitive identity attributes; log stable request, resource, and principal references suitable for auditing.

If the adapter has no `updateAcl` route, state whether access grants are handled by another dedicated reconciler or are unsupported. Hiding consumer bindings inside `provision` is a lifecycle boundary violation.

## Review Signals

- Is `updateAcl` first-class, delegated explicitly, or clearly unsupported?
- Does the implementation reconcile additions **and removals**, including an empty desired set?
- Are technical and externally managed grants protected from accidental revocation?
- Are principal and permission mappings explicit, validated, and least-privileged?
- Does the operation target the resource created by the latest successful provisioning flow?
- Can the same request be retried without duplicate grants or broader permissions?
- Are mapping failures reported before destructive changes where possible?
- After `unprovision` followed by re-`provision`, do previously granted consumer bindings need to be reapplied through a fresh `updateAcl` call, or does the adapter assume they still exist? Is that expectation documented (see [Re-Provisioning Parity](./re-provisioning-parity.md))?
- High severity: consumer bindings happen only during deploy, stale access is never revoked, or reconciliation can remove protected grants.

## Test Coverage

Cover at least one end-to-end `updateAcl` request and verify platform state, not only the HTTP response. Include:

| Scenario | Expected result |
| --- | --- |
| Add and preserve | New principal granted; existing requested principal unchanged |
| Remove | Principal absent from desired state is revoked |
| Empty desired set | All managed consumer grants revoked; protected grants preserved |
| Retry same request | No duplicate grants; final state unchanged |
| Unknown principal | Clear validation failure with no destructive mutation |
| Partial platform failure | Failed principals/actions reported; retry converges |
| Unprovision then re-provision | Managed grants either persist automatically, or the requirement to reapply them via `updateAcl` is documented — not a silent gap discovered later |

For async implementations, also poll the task to `COMPLETED` or `FAILED` and verify that status messages identify the target resource without exposing sensitive data.