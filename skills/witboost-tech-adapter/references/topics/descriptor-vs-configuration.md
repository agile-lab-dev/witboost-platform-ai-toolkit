# Descriptor Versus Adapter Configuration

## Concept

The descriptor carries portable desired state. Adapter configuration carries installation-specific mapping and operator policy. Secret values come from workload identity or secret management. Derived values are computed by adapter code from validated inputs.

Classify every consumed input by authority:

| Input class | Authority | Examples |
| --- | --- | --- |
| Standard product identity and context | Installed-version descriptor contract | Data Product/component IDs, environment, owner, dependencies |
| Portable resource desired state | Typed component `specific` | Resource properties, schema, workload size, schedule, logical target intent |
| Installation mapping and operator policy | Typed adapter configuration | Logical-to-physical target mapping, endpoint allowlist, network, deadline, retry policy |
| Credential or secret value | Workload identity or secret store | API token, client secret, key, cloud credential |
| Product-owned reference to an existing secret | Typed component `specific`, when explicitly part of the component contract | Authorized logical secret reference, never the secret value |
| Derived value | Adapter code | Provider resource identity, path, role name, artifact coordinate |

Fields such as region, project, account, or tenant are not assigned universally. A component contract may treat one as portable logical intent, while adapter configuration maps it to an installation-specific physical target. Define the boundary for each adapter without allowing the two sources to compete silently.

## Design Decision

1. Define the authoritative source and type for every consumed value.
2. Define logical target intent separately from physical endpoint, account, tenant, network, and credential mapping.
3. Define configuration-source precedence among operator-owned sources. Descriptor values must not unexpectedly override operator policy, and configuration must not silently replace portable desired state.
4. Define stable contract defaults in the descriptor schema/template and operational defaults in adapter configuration. Do not use permissive defaults for credentials, destructive behavior, account selection, or authorization policy.
5. Define unknown-field behavior separately for standard descriptor fields and adapter-owned `specific` fields.
6. Define which validation checks are local and which are bounded remote reads. Remote validation may check reachability, authorization, policy, artifact metadata, or resource context when required, but it must not create or modify provider state.
7. If the descriptor contains a secret reference, define allowed namespaces/scopes, caller authorization, resolution identity, and errors that do not reveal whether an unauthorized secret exists.
8. Define how status, unprovision, and `updateAcl` identify an existing resource when `provisionInfo`, provider identifiers, descriptor inputs, and current configuration are available. The target adapter decides their precedence and how divergence is handled.
9. Define behavior after adapter configuration changes for the selected lookup model: preserve backward lookup, retain required non-secret evidence, or migrate existing resources before rollout.
10. Centralize deterministic derivation and reuse it across lifecycle actions.

## Recommendations

- Parse the standard descriptor with the model for the installed Witboost version, resolve `componentIdToProvision` by exact ID, and convert the selected component to a typed adapter-specific model before side effects.
- Keep credential values out of descriptors, ordinary configuration files, generated artifacts, logs, and operation evidence.
- Prefer workload identity or a supported runtime credential chain over long-lived static credentials.
- Reject contradictory descriptor/configuration values where practical instead of relying on hidden precedence.
- Repeat required validation in side-effecting actions; do not assume a prior `/validate` invocation.
- Keep remote validation side-effect-free and deadline-bound.
- Persist provider observations only when the accepted resource-lookup and execution designs require them.
- On conflict between `provisionInfo`, descriptor-derived identity, and current mapping, fail before mutation unless the accepted target decision defines a safe resolution.
- Roll out mapping changes only when the accepted lookup model can still identify existing resources or after an explicit migration.

## Example

```yaml
# Descriptor: portable desired state and logical target intent
specific:
  partitions: 6
  retentionMs: 604800000
  targetRegion: eu
  workspaceSecretRef: vaccinations-databricks
```

```yaml
# Adapter configuration: installation mapping and operator policy
targets:
  eu:
    endpoint: https://kafka.prod.example
    secretNamespace: data-platform-prod
    requestTimeoutMs: 30000
```

The adapter authorizes `targetRegion: eu`, maps it to the physical installation target, authorizes the secret reference inside the configured namespace, and resolves credentials with its runtime identity.

## Review Signals

- A consumed field has no identifiable authority or competes silently across descriptor and configuration.
- Physical endpoints, unrestricted account IDs, credentials, or shared-network internals leak into portable desired state.
- Portable desired state exists only in adapter configuration or hardcoded logic.
- `specific` remains untyped until a provider call or unknown fields become silent no-ops.
- Secret values are committed, logged, returned, or embedded in generated runtime payloads.
- Secret references allow namespace traversal, cross-tenant access, or existence-oracle errors.
- Validate mutates state, performs unbounded remote work, or requires unrelated credentials.
- Lifecycle actions parse or derive the same input differently.
- Resource lookup precedence among `provisionInfo`, provider IDs, descriptor inputs, and current mapping is undefined or differs across actions.
- A mapping change makes existing resources unreachable or redirects lifecycle actions without a migration plan.
- Retry settings in adapter configuration contradict the accepted end-to-end retry policy.

## Test Coverage

- Descriptor-only desired-state changes without adapter configuration changes.
- Operator mapping changes without descriptor changes.
- Exact selected-component resolution and typed `specific` validation.
- Documented handling of unknown standard and adapter-specific fields.
- Configuration precedence and contradictory-value rejection.
- Missing configuration and absence of unsafe defaults.
- Authorized and unauthorized secret references, resolution failures, namespace restrictions, and no existence leak.
- Local and bounded remote validation completing without provider mutation.
- Provision independently rejecting invalid required inputs.
- Consistent normalized inputs across provision, unprovision, retries, and `updateAcl`.
- Every accepted resource-lookup precedence path, including missing evidence and conflicting `provisionInfo`/mapping.
- Mapping migration preserving lookup of resources created under previous configuration.
- Safe handling of `removeData` and other destructive inputs.
