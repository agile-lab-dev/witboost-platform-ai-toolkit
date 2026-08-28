# Re-Provisioning Parity

## Concept

Re-provisioning parity ask the question: is *unprovisioning and reprovisioning* safe? These are distinct properties — `validate`, `provision`, and `unprovision` can each be individually correct and idempotent in isolation while the full `unprovision` → `provision` round trip still degrades the outcome.

The gap appears whenever part of a resource's desired state originates outside the adapter's own lifecycle actions: a value an operator added manually after first provisioning, a grant issued by another team, a record written by another system, or a name still reserved by a provider retention window. `provision` may never have been responsible for creating that state in the first place — it only ever found it already there. `unprovision` deleting the parent resource destroys that state anyway, and the next `provision` recreates the resource without it, reaching a state that looks superficially fine (the resource exists again) but is functionally incomplete compared to a genuine first-time provisioning.

Re-provisioning parity is the contract that this round trip must reach a state functionally equivalent to first-time provisioning — not one that silently depends on state the adapter itself never reconstructs.

## Design Decision

- For every resource `unprovision` can remove, identify whether any part of its desired state originates outside `validate`, `provision`, and `updateAcl` — from an operator, another team, or another system.
- If so, determine whether `provision` reconstructs that state after the resource is recreated, or silently depends on it already being present.
- Treat a `validate` or `provision` check written as "only if this resource already exists" as a specific risk: it exists to avoid rejecting the very first provisioning request, but it also means the check goes silent immediately after a fresh, empty re-creation — exactly when the externally managed state is missing.
- When a gap is found, resolve it one of three ways and record the decision in `docs/decisions/DECISIONS.md`:
	1. Scope `unprovision` to leave the externally managed sub-resource in place instead of deleting it.
	2. Make `provision` restore the missing state itself.
	3. Document the required manual step explicitly and surface it in provisioning output, so it is a known step rather than a silent gap discovered later.
- Do not treat "the resource exists again" as proof of parity. Reconciliation logic that only checks existence, not completeness, can pass right after a destructive round trip while missing exactly the state that was never adapter-owned.

### Examples

**Existence-gated validation losing externally managed state**

```text
first provision -> creates shared resource R (empty)
operator manually adds required entry E into R
validate: "require E in R only if R already exists" -> passes (E present)
unprovision -> deletes R entirely
provision -> recreates R (empty again)
validate: R exists again -> now requires E, but E was never restored -> fails
```

The guard was correct for the first provisioning and for ordinary updates; it only fails across the destructive round trip because `unprovision` removed state that `provision` cannot reproduce on its own.

**Access grants applied outside `provision`**

Consumer grants applied through `updateAcl` (see [Update ACL And Access Grants](./update-acl-and-access-grants.md)) live independently from deployment. If `unprovision` removes the scaffolding those grants were bound to, a subsequent `provision` that only recreates the scaffolding — without either preserving prior grants or clearly requiring a fresh `updateAcl` call — leaves consumers silently without access until someone notices.

**External control-plane object losing operator configuration**

An external control-plane deployment (see [Workload Artifact Contract](./workload-artifact-contract.md)) such as a managed project or job may accumulate settings an operator configured directly in that platform. `unprovision` deleting the object and `provision` recreating a fresh one reproduces the adapter-managed configuration but not the operator-added settings, unless that gap is explicitly designed for.

**Name reuse against a retention window**

Immediately reusing a resource name after `unprovision` (see [Naming Convention](./naming-convention.md)) can resolve to a provider soft-delete or retention window, an external cache, or another lingering reference to the deleted resource, instead of a clean, independent object.

### Existing Adapter Scan

1. For each resource `unprovision` can remove, what part of its desired state — if any — originates outside `validate`, `provision`, and `updateAcl`?
2. Does `provision` reconstruct that externally managed state after re-creation, or does it assume the state is already present?
3. Is there a `validate` or `provision` check gated on "only if this resource already exists" that would silently resume enforcing on a freshly recreated, still-incomplete resource?
4. Do access grants applied via `updateAcl` survive an `unprovision` then `provision` round trip, or must they be explicitly reapplied? Is that expectation documented?
5. Does a re-created external control-plane object regain operator-configured settings that existed before `unprovision`, or does it start from a bare adapter-managed baseline?
6. Does immediate name reuse after `unprovision` risk colliding with a provider soft-delete, retention, or purge window, or an external cache still referencing the deleted resource?
7. Is the resolution for each identified gap — preserved sub-resource, state restored by `provision`, or a documented manual step — recorded in `docs/decisions/DECISIONS.md`?

## Review Signals

- **High**: `unprovision` deletes a resource whose externally managed state is required for correct operation, and nothing in `provision`, documentation, or provisioning output surfaces the resulting gap.
- **Medium**: an existence-gated `validate` or `provision` check depends on state the adapter does not own or reproduce, and `unprovision` can delete the resource that carries it.
- **Medium**: access grants applied through `updateAcl` are not restored by `provision` after an `unprovision` round trip, and reapplying them is not documented as a required step.
- **Medium**: an external control-plane object is recreated after `unprovision` without restoring or flagging operator-configured settings it previously carried.
- **Low**: a resource name is reused immediately after `unprovision` without checking for a provider soft-delete, retention, or purge window.

## Test Coverage

| Scenario | Required assertion |
|---|---|
| Unprovision then re-provision, existence-gated validate/provision check | Either the check still passes with no manual step, or the required manual step is documented and surfaced in provisioning output — it does not silently start failing on freshly recreated state. |
| Unprovision then re-provision, `updateAcl` grants | Managed grants either persist automatically, or the requirement to reapply them is documented — not a silent gap discovered later. |
| Unprovision then re-provision, external control-plane object | The recreated object either restores prior operator-configured settings or the adapter documents that those settings must be reapplied. |
| Unprovision then re-provision, name reuse | The recreated resource is unaffected by a provider soft-delete or retention window from the deleted resource. |
