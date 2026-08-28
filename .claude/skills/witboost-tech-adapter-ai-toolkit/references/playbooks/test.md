# Testing Playbook

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