# Descriptor Versus Adapter Configuration

## Concept

Portable desired state belongs in the descriptor; operator-owned values belong in adapter configuration. Blurring this boundary is a recurring source of coupling between the product contract and the operating environment.

Classify an input by asking who must change it and whether the same descriptor should work in another installation:

| Input class | Authority | Examples |
|---|---|---|
| Standard product identity and context | Standard descriptor fields | Data Product and component IDs, environment, owner, dependencies |
| Portable resource desired state | Component `specific` | Bucket properties, topic partitions, table schema, workload size, schedule |
| Installation and operator policy | Adapter configuration | Cloud account, tenant, region mapping, API endpoint, shared network, timeout, retry policy |
| Credential or secret value | Secret store or workload identity | API token, client secret, private key, cloud credentials |
| Reference to a pre-existing secret | Descriptor `specific` only when product-owned | Name or ID of a secret that is selected by the product contract but resolved by the adapter |
| Derived value | Adapter code | Provider-valid resource name, path, role name, schema subject |

The descriptor states **what** the Data Product requires. Adapter configuration states **where and under which operator policy** it is realized. Derived values are outputs of those inputs, not a third source of desired state.

## Design Decision

- Put portable desired state in typed component `specific` fields. Parse the standard descriptor first, resolve `componentIdToProvision` by exact component ID, and then validate only the selected component against the adapter-specific model.
- Keep operator-owned values in typed adapter configuration: tenant and subscription IDs, platform endpoints, shared networking, environment-to-account mappings, retries, timeouts, and technical authorization policy.
- Keep credential values out of descriptors and ordinary configuration files. Prefer workload identity or the platform SDK credential chain; otherwise inject secrets through a secret store or Kubernetes `secretKeyRef`.
- Use a descriptor-visible secret reference only when selecting an existing secret is portable product intent. The descriptor carries the reference, while adapter identity and configuration authorize and perform resolution.
- Do not allow descriptor and configuration fields to compete for the same semantic value. If an exception is required, define one explicit precedence rule, reject contradictory values where practical, and test the rule.
- Make configuration-source precedence explicit. A typical order is runtime override or constructor, environment variable, mounted configuration file, then a non-sensitive default. Do not depend on framework precedence without documenting it.
- Define defaults once and classify them:
	- Contract defaults are stable desired-state semantics and belong in the descriptor schema or template.
	- Operational defaults belong in adapter configuration.
	- Credentials, destructive behavior, account selection, and security policy must not receive permissive fallback defaults.
- Centralize deterministic derivation from validated inputs and reuse it in every lifecycle action. Do not pass the whole descriptor to generated runtime artifacts when a minimal, typed input contract is sufficient.
- Keep `validate` pure and bounded: decode, type-check, enforce cross-field invariants, and validate syntax without creating resources or preparing deployment artifacts. Side-effecting actions must repeat the required validation rather than assume `/validate` was called.
- Decide how unknown fields behave. Preserve unknown standard descriptor fields when forward compatibility requires it, but reject or clearly report unknown fields in adapter-owned `specific` models so misspellings do not become silent no-ops.
- Persist normalized effective inputs or provider IDs when an asynchronous operation must survive configuration changes. Status, unprovision, and `updateAcl` must not reinterpret an old request using incompatible current settings.
- Persist every ownership, precedence, default, and secret-resolution decision in `docs/decisions/DECISIONS.md`.

### Best-Practice Examples

**Portable desired state versus installation context**

```yaml
# Descriptor
specific:
	partitions: 6
	retentionMs: 604800000
```

```yaml
# Adapter configuration
kafka:
	bootstrapServers: kafka.prod.example:9092
	schemaRegistryUrl: https://schema.prod.example
	requestTimeoutMs: 30000
```

Partitions and retention travel with the component. The broker endpoint and timeout can change without changing the descriptor.

**Descriptor-visible secret reference**

```yaml
specific:
	workspaceSecretRef: vaccinations-databricks
```

The adapter validates the reference syntax and resolves it with its workload identity. The descriptor never contains the secret value, and changing adapter credentials does not alter product intent.

**Explicit precedence**

```text
constructor override > environment variable > mounted YAML > safe default
```

Use this hierarchy only among configuration sources for the same operator-owned setting. A descriptor field must not unexpectedly override an operator-owned endpoint, nor may configuration silently replace descriptor-owned desired state.

**Typed selected component**

Given a descriptor containing Kafka, storage, and workload components, first match `componentIdToProvision` exactly. Validate the selected Kafka component as `KafkaOutputPortSpecific`; do not reject unrelated component-specific fields and do not access an untyped `specific["partitions"]` map during provisioning.

## Review Signals

### Existing Adapter Scan

1. Which standard request and descriptor fields are consumed, and which are merely tolerated?
2. Is `componentIdToProvision` matched exactly and converted to a strict adapter-specific type before any side effect?
3. For every consumed input, is the authority standard descriptor, component `specific`, adapter configuration, secret store, or derived code?
4. Does each `specific` field describe portable desired state, or has installation context leaked into the descriptor?
5. Which settings come from environment variables, files, Helm values, command-line or constructor overrides, and SDK defaults?
6. What is the exact precedence among configuration sources? Is the same semantic value also present in the descriptor?
7. Where is each default declared, and is it contractual, operational, security-sensitive, or destructive?
8. Are secret values, secret references, and the identity used to resolve them clearly separated?
9. Are unknown standard and adapter-specific fields rejected, preserved, or silently ignored?
10. What validation occurs during decoding, `/validate`, provision, unprovision, and `updateAcl`? Is `/validate` pure?
11. Are derived names, paths, artifact coordinates, and principal IDs produced by shared functions from validated inputs?
12. Do all descriptor-consuming actions use the same parser and normalized component contract?
13. Can an operator change connectivity or credentials without changing descriptors, and can desired state change without redeploying adapter configuration?
14. Can configuration drift alter status, cleanup, retries, or ACL updates for an already-started operation?

### Findings To Flag

- A field's authority cannot be identified, or descriptor and configuration silently override each other.
- Operator-specific endpoints, account IDs, credentials, or shared networking are embedded in the descriptor.
- Portable desired state exists only in adapter configuration or hard-coded adapter logic.
- `specific` remains an untyped map until a side-effecting call, or unknown fields are silently ignored.
- Secrets appear as literal descriptor values, source-controlled defaults, logs, or generated runtime payloads.
- Required credentials or destructive options have insecure fallback defaults.
- Configuration precedence is undocumented or duplicated across application files, Helm values, and code.
- `/validate` creates resources, mutates state, or requires credentials unrelated to bounded validation.
- Provision assumes prior validation, or lifecycle actions parse and derive the same inputs differently.
- Status or cleanup recomputes effective inputs from mutable current configuration instead of persisted operation data.

## Test Coverage

Use table-driven schema tests and lifecycle contract tests. Cover at least:

- a descriptor-only desired-state change without an adapter configuration change;
- an operator-only configuration change without a descriptor change;
- exact selected-component resolution and rejection of a missing or mismatched component ID;
- valid and invalid typed `specific` fields, including the documented unknown-field behavior;
- configuration precedence at every supported source boundary;
- missing required configuration and absence of unsafe defaults;
- secret-reference validation, resolution failure, and proof that secret values are neither returned nor logged;
- `validate` completing without side effects;
- provision independently rejecting invalid required inputs;
- identical normalized and derived inputs across provision, unprovision, retries, and `updateAcl`;
- asynchronous status and cleanup remaining correct after relevant runtime configuration changes;
- default values producing the documented effective contract, including safe handling of destructive flags such as `removeData`.
