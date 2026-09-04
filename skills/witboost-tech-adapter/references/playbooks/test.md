# Testing Playbook

## Select The Mode

- **Design mode:** derive and return a test matrix without executing commands or changing provider state.
- **Local execution:** run repository-local, non-provider tests when the user asks to test and the commands are safe for the local workspace.
- **Target execution:** calls to a real provider or environment require the user to name the environment and explicitly authorize side effects. Confirm resource isolation, expected cost, and cleanup before execution.
- **Destructive target execution:** `unprovision` with `removeData=true` requires a separate explicit confirmation of the named environment and accepted data loss immediately before execution.

A general request to "test" does not authorize real provider mutations or destructive cleanup.

## Derive The Contract

Derive routes, payloads, response schemas, status paths, and local startup commands from the target repository. Prefer maintained local scripts when they express the real contract; otherwise use direct HTTP requests such as cURL. Never copy another adapter's request shape without target-repository evidence.

## Build The Matrix

Use the relevant topic `Test Coverage` sections and the [test matrix](../../assets/test-matrix.md). At minimum, cover:

1. successful and failing validation;
2. success and failure for every supported side-effecting lifecycle action;
3. observable asynchronous acceptance, progress, and terminal status when applicable;
4. retry, duplicate, partial-failure, and recovery behavior required by the selected topics;
5. access reconciliation when the adapter owns access grants.

## Record Evidence

Record exact commands or requests, observed results, status polling evidence, and checks that require a real target environment. Do not claim provider behavior from mocks alone.

Never record credentials, secret values, authorization headers, session cookies, or reusable tokens. Redact them from commands, payloads, logs, screenshots, and persisted evidence. User and group identifiers may be retained when needed to prove ACL behavior, subject to the target repository's data-handling policy.

For side-effecting execution, also record the named environment, approval scope, created resources, cost-relevant operations, cleanup plan, and cleanup outcome.
