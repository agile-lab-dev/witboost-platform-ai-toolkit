# Idempotency And Retry Behavior

## Concept

Witboost may submit the same lifecycle request more than once. This can happen because the original response was lost, a timeout left the outcome unknown, status polling failed, an operator retried an operation, or two workers processed the same request concurrently. The adapter must therefore assume that `provision`, `unprovision`, and `updateAcl` can be repeated at any point, including after only some side effects completed.

An operation is idempotent when repeating the same intent converges on the same final provider state without creating duplicates, losing valid state, or applying an effect twice. This does not mean that every response or execution trace must be identical. A retry may continue an existing operation, repair drift, or complete missing steps; the observable result must still represent one logical lifecycle operation.

For example, suppose `provision` creates a storage bucket and then times out before assigning its policy. Witboost cannot know whether the bucket was created and safely retries. The adapter must discover the existing bucket, verify or reconcile its configuration, and continue with the policy. It must not create another bucket, fail merely because the bucket exists, or report success while the policy is missing.

That guarantee requires three complementary layers:

1. **Request identity** answers: "Have I already accepted this exact intent?" A stable operation key and a fingerprint of the relevant payload associate retries with the original operation. The same key and payload return or continue that operation; the same key with a different payload is a conflict.
2. **Workflow recovery** answers: "Which steps have already completed?" A multi-step operation records enough durable progress to resume after timeout, crash, or replica change, or compensates completed steps when it cannot continue safely.
3. **Resource reconciliation** answers: "Does the provider already match the desired state?" Stable resource identities plus read/compare/create-or-update logic make existing, missing, and partially configured resources converge to the descriptor.

All three layers matter. Deterministic naming supports resource reconciliation but does not deduplicate accepted requests or preserve workflow progress. Likewise, a durable task ID does not prevent duplicate cloud resources if the provider mutations are blind creates. Retry is the mechanism that repeats an attempt; idempotency is the property that makes that repetition safe.

[Re-provisioning parity](./re-provisioning-parity.md) is a related but distinct contract: it asks whether undoing and redoing a request (`unprovision` followed by `provision`) is safe, while idempotency asks whether repeating the same request is safe. See that topic for the destructive-cycle failure modes this creates, such as a `validate` check silently losing coverage once the resource it guards is deleted and recreated.

## Design Decision

- Derive every provider resource from a stable identity and reconcile current state to desired state. Prefer provider upsert or atomic conditional writes over blind create.
- Persist the operation key, request fingerprint, state, completed steps, and terminal result for async actions. The store must survive restart and be shared by all replicas.
- Return the existing operation when a key and fingerprint match; reject key reuse when the payload differs.
- Make check-then-create race-safe: after an already-exists conflict, read the winner and reconcile it.
- Treat deletion of an absent resource as success. `updateAcl` must diff desired and current bindings, including removals.
- Retry only classified transient failures such as throttling, selected `5xx`, optimistic-concurrency conflicts, or bounded eventual-consistency misses. Authentication, authorization, validation, and policy errors are terminal.
- Use exponential backoff with jitter, a delay cap, and an attempt or elapsed-time budget. Honor provider retry hints where available.
- Keep async states monotonic: `RUNNING -> COMPLETED | FAILED`. Terminal results must remain queryable.
- Stage replacements and switch atomically where possible. Otherwise journal progress and define compensation that preserves the last known-good state.

### Examples

**Desired-state ACL reconciliation**

```text
current = {alice, bob}
desired = {bob, carol}
remove alice; add carol; leave bob unchanged
```

Repeating the request produces no further change. Databricks Python `OutputPortHandler.update_acl` follows this pattern.

**Bounded concurrency retry**

```text
read IAM policy -> update with etag -> ABORTED
back off with jitter -> re-read -> recompute -> update
```

Retry only the concurrency failure; fail permission errors immediately. BigQuery, Dataproc, and GCS adapters provide this pattern.

**Unsafe async token**

```text
POST /provision -> task ID stored only in memory
process restarts -> GET /status returns unknown task
```

A task ID alone is not durable idempotency. Persist operation identity and state.

**Unsafe replacement**

```text
delete current artifacts -> upload replacement -> upload fails
```

This can destroy the last good state. Upload to staging, validate, then switch or promote.

### Existing Adapter Scan

For each lifecycle operation and provider resource, answer:

1. What stable key identifies the request and desired resource?
2. Does the operation reconcile, upsert, or blindly create?
3. Can concurrent requests race between lookup and create?
4. Is request state durable across restart and shared across replicas?
5. What happens when an operation key is reused with the same or a different payload?
6. Which exact errors are retryable, and which are terminal?
7. Are backoff, jitter, delay cap, and total budget explicit?
8. How are eventual-consistency misses represented and bounded?
9. Can a failed multi-step operation resume or compensate safely?
10. Is repeated delete/not-found treated as success?
11. Does `updateAcl` reconcile both additions and removals?
12. Do tests repeat and concurrently submit the same request?

## Review Signals

- **High**: repeated or concurrent provision can create duplicate resources, credentials, keys, roles, jobs, or bindings.
- **High**: an accepted async operation becomes untraceable after restart or on another replica.
- **High**: retry after partial failure repeats side effects without reconciliation, journaling, or compensation.
- **Medium**: all provider failures are retried, or retries have no jitter or finite budget.
- **Medium**: unprovision fails on not-found.
- **Medium**: `updateAcl` only adds grants and cannot converge after principal removal.
- **Medium**: cleanup-before-replacement can destroy the last known-good state.
- **Low**: status does not distinguish active convergence, retry wait, timeout, and terminal failure.

Across the analyzed adapters, deterministic upserts are common; BigQuery, Dataproc, and GCS classify and bound retries; Databricks reconciles provider state; Argo CD and Sifflet normalize missing deletes. No adapter proves durable request deduplication and end-to-end repeat convergence.

## Test Coverage

Assert provider inventory and final desired state; an identical HTTP response alone does not prove idempotency.

| Scenario | Required assertion |
|---|---|
| Sequential duplicate provision | One logical resource set with the requested configuration. |
| Concurrent duplicate provision | Both requests converge; an already-exists race is reconciled. |
| Failure after each workflow step | Retry resumes without duplicating completed side effects. |
| Retry classification | Transient failures retry; terminal failures propagate immediately. |
| Retry exhaustion | Backoff is jittered and capped; the operation reaches a meaningful terminal state. |
| Eventual consistency | Temporary misses remain `RUNNING`; a bounded timeout fails clearly. |
| Repeated unprovision | The second request and provider not-found both succeed. |
| Repeated `updateAcl` | No duplicate grants; removed principals are revoked; unchanged grants are untouched. |
| Restart and multi-replica polling | Any replica retrieves the accepted operation and terminal result. |
| Reused operation key | Same fingerprint returns the original operation; a different fingerprint is rejected. |
| Status monotonicity | Terminal states never regress to `RUNNING`. |
| Replacement failure | The last known-good state is preserved or restored. |
