# Connectivity To The Target Technology

## Concept

A tech adapter connects Witboost lifecycle actions to a target technology. Keep logical target intent separate from installation-specific connectivity:

- the descriptor may carry portable intent needed to select a logical target, such as an environment, region class, project reference, or resource identity;
- adapter configuration resolves that intent to physical endpoints, accounts, tenants, networks, trust material, and runtime policy;
- workload identity or secret management supplies credentials without placing secret values in the descriptor.

The exact authority of fields such as region, project, account, or tenant is a Target Decision. The same concept may be product intent in one adapter and an operator-controlled mapping in another.

## Design Decision

For each target and lifecycle action, decide:

1. Which descriptor fields express portable target intent and which configuration maps that intent to physical infrastructure.
2. Whether endpoint selection is fixed, allowlisted, provider-derived, or selected through an operator-owned mapping. Descriptor input must not enable arbitrary network destinations.
3. Which authentication mechanism is used, which principal executes the action, and which least-privilege scopes it requires.
4. How credentials, certificates, and trust material are sourced and rotated without restarting or persisting secret values where avoidable.
5. TLS, mTLS, certificate verification, trust-store, proxy, DNS, egress, and private-network requirements.
6. Connection and request deadlines for each provider operation.
7. How SDK/client retry behavior implements the end-to-end policy owned by [Idempotency And Retry Behavior](./idempotency-and-retries.md).
8. How provider errors are normalized into actionable lifecycle results without exposing credentials or raw sensitive payloads.
9. Which connectivity facts are safe to expose through Witboost-visible output and diagnostic logs.

Client construction, pooling, caching, reuse, and disposal follow the selected SDK and target-repository patterns. This generic pack does not recommend a universal client lifecycle strategy.

## Recommendations

- Prefer workload identity or the provider's supported runtime credential chain over long-lived static credentials.
- Keep secret values out of descriptors, source control, logs, lifecycle results, and persisted operation records.
- Authorize descriptor-provided logical target references before resolving them to physical endpoints or secret namespaces.
- Allowlist or map descriptor-influenced destinations to prevent arbitrary endpoint access and confused-deputy behavior.
- Verify TLS by default; document and review any exception as an explicit Target Decision.
- Bound every remote call with connection and request deadlines. Long provider operations should use a compatible asynchronous lifecycle design rather than an unbounded HTTP request.
- Coordinate provider, SDK, client, workflow, and caller retries under one accepted budget.
- Plan credential and certificate rotation, including how existing async operations continue safely.
- Limit connection concurrency and provider request rates according to the target's quotas and adapter deployment model.

## Review Signals

- Endpoint, account, tenant, credential, or trust material is hardcoded or committed.
- Descriptor input can select arbitrary endpoints, accounts, secret paths, or network destinations.
- Logical target intent and physical operator mapping compete for the same value without precedence or validation.
- Credentials have broader scope than the lifecycle action requires or cannot rotate safely.
- TLS verification is disabled without an accepted target decision.
- Remote calls have no enforceable deadline.
- SDK/client retries contradict or multiply the accepted end-to-end retry budget.
- Provider errors expose secrets, authorization headers, connection strings, or sensitive payloads.
- Missing proxy, DNS, egress, private-network, or rate-limit behavior makes production connectivity non-deterministic.

## Test Coverage

- Verify logical target inputs resolve only to authorized physical targets.
- Reject arbitrary or cross-tenant endpoint/account/secret selection.
- Verify credentials and trust material come from approved runtime sources and never appear in recorded evidence.
- Exercise missing, expired, rotated, and insufficient credentials.
- Verify certificate validation, custom trust, mTLS, proxy, DNS, and network failure behavior when applicable.
- Enforce connection and request deadlines under slow or unreachable providers.
- Verify SDK/client retries remain within the accepted end-to-end retry policy.
- Verify provider errors are normalized and sanitized.
- Exercise quota, rate-limit, and connection-exhaustion behavior when relevant to the target.
