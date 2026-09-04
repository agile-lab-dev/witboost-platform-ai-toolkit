# Idempotency And Retry Behavior

## Concept

Witboost or an operator may repeat a lifecycle request after a lost response, timeout, partial failure, or uncertain outcome. Concurrent requests may also target the same resource. The Tech Adapter API does not provide a universal idempotency key, so the generic safety model starts from stable resource identity and provider-state reconciliation rather than assuming request deduplication.

Three mechanisms may contribute:

1. **Resource reconciliation:** derive a stable target identity, read current provider state, and converge it toward desired state. This is the primary mechanism for side-effecting lifecycle actions.
2. **Workflow recovery:** retain completed steps or compensation evidence when a multi-step action cannot be safely reconstructed from provider state alone.
3. **Operation deduplication:** use a durable operation key and canonical request fingerprint when the target protocol, async implementation, or workflow design supplies a meaningful key. It is conditional, not mandatory for every synchronous adapter.

Retry is the mechanism that repeats an attempt. Idempotency is the property that keeps repetition safe. A durable task token does not prevent blind duplicate provider resources, while deterministic naming alone does not recover a partially completed workflow.

[Teardown And Recreate Safety](./teardown-and-recreate-safety.md) covers opposite intents (`unprovision` then `provision`), not repetition of the same intent.

## Design Decision

For each lifecycle action and provider boundary, decide:

1. Stable target identity and how ownership is verified before update or deletion.
2. Whether provider state alone is enough to resume, or a durable workflow journal is required.
3. Whether an operation key exists; its source, tenant scope, retention, and atomic claim behavior.
4. If fingerprints are used, the canonical serialization and fields included or excluded. Never include resolved secret values.
5. Whether a repeated terminal request returns cached evidence, performs a fresh reconciliation, or starts a new operation.
6. The end-to-end retry policy: retryable errors, terminal errors, attempt and elapsed-time budget, backoff, jitter, provider hints, and interaction with the caller's deadline.
7. How SDK/client retries and workflow retries share that budget so attempts are not multiplied invisibly.
8. How partial completion resumes, compensates, or preserves the last known-good state.
9. What an already absent resource means during `unprovision`. The recommended option is success only after target/account/identity and provider absence semantics are verified; the target decision may choose another documented outcome.
10. How concurrent requests avoid blind create, lost update, duplicate credentials, or duplicate bindings.

This topic owns the retry policy. Connectivity configures transport and SDK behavior to implement this decision; it must not establish an independent retry budget.

## Recommendations

- Prefer provider upsert, compare-and-set, idempotency token, or atomic conditional write over check-then-create.
- When check-then-create is unavoidable, treat already-exists as a race: read the winner, verify ownership, and reconcile it.
- Retry only classified transient failures, such as throttling, selected `5xx`, optimistic-concurrency conflicts, or bounded eventual-consistency misses. Authentication, authorization, validation, and policy errors normally terminate the attempt.
- Use exponential backoff with jitter, a delay cap, and an attempt or elapsed-time budget. Honor provider retry hints within the end-to-end deadline.
- Persist workflow progress for async or multi-step actions when provider state cannot prove completed steps.
- Stage replacements and promote atomically when possible. Otherwise journal progress and define compensation that preserves the last known-good state.
- For `updateAcl`, repeat the same full snapshot and recompute additions/removals from current managed grants.

## Review Signals

- Repeated or concurrent provisioning can create duplicate resources, credentials, keys, roles, jobs, or bindings.
- A retry after partial failure blindly repeats non-idempotent side effects.
- Request-key deduplication is required even though no stable, scoped key exists.
- The same operation key accepts a materially different canonical payload.
- Provider, SDK, HTTP client, workflow, and caller retries multiply beyond the declared budget.
- Every provider error is retried, or authentication/authorization failures are treated as transient.
- Check-then-create has no already-exists race handling or ownership verification.
- Unprovision treats every not-found as success without verifying account, region, target identity, and provider semantics.
- Cleanup-before-replacement can destroy the last known-good state.
- Async workflow progress or terminal evidence is lost across restart after durability was accepted as a target decision.

## Test Coverage

| Scenario | Required assertion |
| --- | --- |
| Sequential duplicate provision | One logical resource set converges to requested configuration. |
| Concurrent duplicate provision | Already-exists or optimistic-concurrency races reconcile without duplicate ownership. |
| Failure after each workflow step | Retry resumes, reconciles, or compensates without replaying completed effects unsafely. |
| Retry classification | Configured transient failures retry; terminal failures propagate immediately. |
| Combined retry layers | SDK/client and workflow attempts remain within one declared budget and deadline. |
| Retry exhaustion | Backoff is bounded and the action reaches an observable terminal outcome. |
| Eventual consistency | Temporary misses are bounded and do not become false success. |
| Repeated unprovision | Behavior matches the accepted absent-resource decision after target identity is verified. |
| Repeated `updateAcl` | No duplicate grants; removed principals are revoked; unchanged managed grants remain. |
| Restart and multi-replica execution | Accepted durability and workflow-recovery guarantees hold across replicas. |
| Reused operation key, when supported | Same fingerprint follows the accepted replay policy; different fingerprint is rejected. |
| Replacement failure | Last known-good state is preserved or restored. |
