# Sync Versus Async

## Protocol Contract

The installed-version Tech Adapter OpenAPI defines which lifecycle actions can return a terminal response and which can return `202` with a task token. It also defines the status and termination routes, response schemas, and status enum available to that installation.

For the latest public API, `provision`, `unprovision`, `updateAcl`, and reverse provisioning support terminal `200` or asynchronous `202`; validation has separate synchronous and asynchronous API versions. Verify this against the customer-local OpenAPI when the Witboost installation is older.

Source: [Witboost Tech Adapter API](https://docs.witboost.com/docs/apis/extension-points/control-plane/builder/tech-adapter-api).

Use only statuses and protocol transitions exposed by the installed-version OpenAPI. Treat termination, cancellation, and token expiry as separate capabilities; do not invent protocol states to represent internal workflow details.

## Concept

- **Synchronous:** the initiating request remains open until the action reaches a terminal result.
- **Asynchronous:** the initiating request returns a task token while work continues, and Witboost polls the action's status endpoint.

Programming-language async syntax does not make the protocol asynchronous. If the HTTP request waits for provider polling, a subprocess, or all side effects, the action is synchronous from Witboost's perspective.

## Design Decision

For every lifecycle action:

1. Select one of the modes allowed by the installed-version OpenAPI. Record route, response code, result schema, status route, and termination support.
2. Decide what work may happen before a `202` response and what acceptance record exists. The recommendations below describe the production durability target.
3. Decide how accepted work is dispatched and recovered after a crash between acceptance and execution. Options include transactional enqueue, outbox, a recoverable scanner, or another mechanism justified by the deployment model.
4. Decide task-store scope, retention, expiry, and cleanup.
5. Decide how every replica authorizes and retrieves status by token and tenant/resource context.
6. Decide worker concurrency, leases or fencing where needed, shutdown behavior, and backpressure.
7. Decide how provider operation identifiers and partial progress are retained without persisting credentials.

The latest public API recommends asynchronous validation even when validation is short. Treat that as a product recommendation and input to the target decision, not as a protocol requirement.

## Recommendations

- For a production action returning `202`, persist token, action, target identity, protocol status, timestamps, terminal result, and required provider handles in storage shared by all replicas. In-memory state is suitable only for development or an explicitly accepted reduced-reliability deployment.
- Make protocol status transitions monotonic according to the installed-version enum. Internal states such as queued, retry-wait, or compensating may exist, but map them without inventing public statuses.
- Ensure an accepted task cannot remain permanently undispatched after a process crash. The concrete recovery mechanism is a Target Decision.
- Scope status lookup by tenant and target context; do not treat a guessable token as sufficient authorization unless the product contract explicitly makes it a bearer credential.
- Define retention and return the installed-version error contract for unknown or expired tokens.
- Keep remote work within explicit deadlines. Coordinate retry behavior through [Idempotency And Retry Behavior](./idempotency-and-retries.md).

## Review Signals

- A route advertises `202` but performs all work before returning or exposes a stub status endpoint.
- Tokens or terminal results exist only in process memory in a production multi-replica deployment without an accepted reliability tradeoff.
- An accepted task can be lost between persistence and dispatch.
- Status can be read across tenants or resources using only an enumerable token.
- Public responses use states not present in the installed-version OpenAPI.
- Terminal protocol states regress to a running state.
- Provider polling is unbounded or process restart loses the provider operation handle.
- Cancellation, termination, unknown-token, or expiry behavior is claimed but not represented by the installed API version.

## Test Coverage

- Verify each action's selected sync/async response against the installed-version OpenAPI.
- For synchronous actions, verify terminal response and enforced deadline.
- For asynchronous actions, verify early acceptance, authorized status polling, every supported protocol status, and terminal result.
- Verify unknown and expired tokens using the installed-version error schema.
- Verify restart and multi-replica continuity when durable operation handling is an accepted target decision.
- Exercise the acceptance-to-dispatch crash boundary and selected recovery mechanism.
- Verify duplicate workers, leases/fencing when applicable, backpressure, and graceful shutdown.
- Verify termination only when supported and ensure polling continues according to the API contract.
