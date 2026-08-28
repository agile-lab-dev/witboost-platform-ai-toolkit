# Sync Versus Async

## Concept

Witboost supports Tech Adapters whose lifecycle operations are either synchronous or asynchronous. The adapter can choose the appropriate model for `provision`, `unprovision`, and `updateAcl`:

- **Synchronous:** the request stays open until the work finishes, then returns the final result.
- **Asynchronous:** the request quickly returns a task token, the work continues in the background, and the caller polls a status endpoint until completion.

`validate` is normally synchronous, bounded, and side-effect free. Witboost can also support async validation when that capability is enabled; use the OpenAPI specification as the source of truth for protocol details.

A complete async contract must also persist task and provider state, so polling and recovery still work after a restart or on another replica. Code declared with `async`, futures, or background hooks is not enough: if the request waits for provider polling or a subprocess, the lifecycle operation is still synchronous.

## Design Decision

- Keep `validate` sync by default, bounded, and side-effect free. Consider async validation only for long-running checks and when the capability is enabled.
- Default remote side effects to async. A sync exception needs an enforceable deadline within the request budget.
- Record initial state and dispatch work before returning acceptance; keep provision and unprovision symmetric unless explicitly justified.
- Persist task identity, operation, resource key, state, attempts, result, timestamps, and provider operation IDs. In-memory state is development-only.
- Use monotonic transitions; distinguish unknown/expired tokens from failures; define deadlines, retries, cancellation, and restart recovery. Apply the same rules to `updateAcl`.

### Existing Adapter Scan

For each lifecycle action, answer:

1. Does the endpoint return a terminal result or token, and what work occurs before that response?
2. Is state committed before acceptance and shared across restarts, workers, and replicas?
3. Which transitions exist, and how are unknown, expired, failed, and cancelled tasks represented?
4. Are provider IDs persisted, calls bounded, and interruption recoverable?
5. Are provision and unprovision symmetric, and is `validate` pure and bounded?
6. Do OpenAPI, docs, implementation, and tests agree?

## Review Signals

- Advertised `202` or status routes are synchronous or stubs.
- Provider polling or subprocesses block before token return.
- Async syntax is mistaken for async execution.
- Tokens depend on process memory; unknown tokens look like failed tasks.
- Polling lacks backoff, deadline, provider handles, recovery, or cancellation.
- `validate` has mutations or unbounded remote work; sync side effects lack a timeout.

## Test Coverage

- One successful `validate` and one failing `validate`.
- Sync exceptions: terminal response, enforced timeout, and no misleading polling contract.
- Async actions: early acceptance, observable `RUNNING`, and terminal success/failure for provision and unprovision.
- Unknown/expired tokens, duplicates, provider timeout, cancellation, restart, and multi-replica continuity.
- OpenAPI response codes and schemas match route behavior.
