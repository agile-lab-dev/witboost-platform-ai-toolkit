# Naming Convention

## Concept

Resource naming is a lifecycle contract, not a formatting detail. Every platform object created, looked up, updated, granted access to, polled, or deleted by the adapter needs one stable naming authority and one reproducible identity.

The canonical identity is the ordered set of stable inputs that distinguishes a resource, such as domain, data product, component, environment, version, principal, account, project, or region. A platform-specific naming function turns that identity into a valid resource name. Display names such as `name` or `fullyQualifiedName` are not stable identity inputs unless the descriptor contract explicitly makes them immutable.

By default, the Data Product major version is part of that identity. A new Data Product major version represents a new Data Product identity and therefore requires new infrastructure. Minor and patch releases remain within the same major-version infrastructure unless a separate lifecycle decision says otherwise. Component version is not the default infrastructure versioning authority: use it only for a resource whose lifecycle and coexistence requirements are genuinely component-version-specific.

Some resources are intentionally shared across Data Product major versions, such as a pre-existing account-level namespace or another platform object whose ownership and lifecycle sit above a single Data Product identity. Omitting the Data Product major version is valid only when this shared scope, its ownership, compatibility, and cleanup behavior are explicit. It is an exception, not the naming default.

Existing adapters show two legitimate ownership models:

- **Descriptor-owned name:** the template or descriptor supplies the final platform name and the adapter validates and passes it through.
- **Adapter-derived name:** the descriptor supplies identity inputs and the adapter applies a documented platform-specific derivation.

Configuration may supply a parent scope, namespace, prefix, or suffix, but must not silently replace deployable identity that belongs in the descriptor. Artifact coordinates and runtime resource names are separate contracts even when one is used to deploy the other.

### Standard Descriptor Inputs

Use the most authoritative field for each kind of input; do not choose one descriptor field as the source for everything.

| Required input | Preferred source | Guidance |
|---|---|---|
| Domain identifier | Parsed data product or component `id` | Treat the structured identifier as machine identity. If `dataProduct.domain` is also present, validate that it agrees rather than silently choosing one. |
| Data product identifier | Parsed `dataProduct.id` | Do not derive it from `name` or `fullyQualifiedName`; those are human-facing labels unless the target descriptor contract explicitly says otherwise. |
| Data product major version | Version segment of the parsed `dataProduct.id`, cross-checked with the selected component `id` | Include it by default in infrastructure identity: a new Data Product major version implies a new Data Product and new infrastructure. Do not obtain it with unchecked positional string splitting. |
| Full data product version | `dataProduct.version` | Use for release or artifact resolution, not normally for runtime infrastructure naming. Include it only when minor or patch releases must coexist as separate resources. |
| Component identifier | Parsed selected component `id` | Resolve `componentIdToProvision` by exact equality against `dataProduct.components[].id`, then use the selected component model. Treat the request field as a selector, not as a second naming authority. |
| Component version | The component version field defined by the target descriptor contract | Use only in the rare case where the resource has an independent component-version lifecycle or multiple component versions must coexist within one Data Product major version. Do not substitute it for the Data Product major version or assume version fields are interchangeable. |
| Environment | `dataProduct.environment` | Environment is not normally encoded in the Witboost data product or component URN. Normalize it only inside the platform-specific naming function. |
| Human-readable label | `name` or `fullyQualifiedName` | Use for display or metadata. Do not use as machine identity unless immutability and uniqueness are contractual. |
| Platform resource name | The relevant `specific` field when the descriptor owns the final name | Validate and pass through unchanged. Do not rebuild an explicitly supplied final name from standard fields. |
| Tenant, account, project, region, or namespace | Dedicated descriptor `specific` field or adapter configuration, according to ownership | Keep deployment-specific scope out of generic Witboost identity unless the contract explicitly includes it. |

Prefer an official descriptor model or a small validated parser that returns named fields such as `domain`, `dataProduct`, `majorVersion`, and `component`. Reject an unexpected identifier kind, prefix, or segment count. Code such as `id.split(":")[4]` is not a naming contract: it hides the schema assumption, fails unclearly, and tends to be duplicated across lifecycle actions.

The scan of active adapters found recurring useful patterns: URN-derived component identity, explicit environment or version isolation where resources must coexist, centralized pure naming helpers, and deterministic truncation with a hash suffix. It also found recurring risks: unrestricted pass-through names, raw URN array indexing, lossy sanitization without collision handling, inconsistent normalizers across lifecycle actions, mutable display-name lookups, and fixture-only conventions that the adapter does not enforce.

## Design Decision

- Inventory every named runtime resource, including resources created indirectly by `updateAcl`, deployment bundles, or generated artifacts.
- For each resource, choose exactly one authority: descriptor-owned final name or adapter-derived name. Record any configuration-owned parent scope separately.
- Define the canonical identity as an ordered tuple of source fields. Parse structured identifiers such as Witboost URNs with a model or validated parser rather than positional string splitting.
- Classify the resource scope explicitly: global, account/project, environment, data product, component, subcomponent, version, principal, or a documented shared scope.
- Include the Data Product major version in the infrastructure identity by default. A new major version must resolve to distinct infrastructure.
- Add component version only when the resource has an explicitly independent component-version lifecycle. Record why Data Product major version alone is insufficient.
- Omit Data Product major version only for a resource intentionally shared across major versions. Record its higher-level owner, compatibility guarantees, provisioning responsibility, and cleanup behavior.
- Decide whether environment belongs in the name, in a parent scope, or is intentionally absent. The decision must follow coexistence and cleanup requirements, not visual preference.
- Record provider constraints: allowed characters, case sensitivity, reserved forms, leading and trailing rules, separators, and maximum length.
- If the adapter derives the name, use one pure platform-aware function that applies operations in this order:
	1. Build the canonical unbounded identity.
	2. Apply deterministic case and character normalization.
	3. Detect whether normalization is lossy and define collision behavior.
	4. Truncate only after reserving space for separators and a stable hash suffix.
	5. Validate the final result against provider constraints.
- Compute collision suffixes from the full canonical identity, not from the truncated or normalized prefix. Use enough hash entropy for the expected resource population and collision impact; do not assume a short suffix is universally safe.
- If the descriptor owns the final name, preserve it exactly and validate it at the adapter boundary. Do not rely on the originating template or provider API as the only validation layer.
- Reuse the same function or immutable resolved identifier in `validate`, `provision`, `status`, `unprovision`, reverse provisioning, and `updateAcl`. Prefer persisted platform IDs for lifecycle operations when the platform provides them.
- Treat naming changes as compatibility changes. Document how existing resources remain discoverable, whether rename is supported, and how migration and cleanup work.
- Persist the authority, identity tuple, scope, normalization, truncation, collision, and migration decisions in `docs/decisions/DECISIONS.md`.

### Best-Practice Examples

Given this descriptor identity:

```yaml
dataProduct:
  id: urn:dmb:dp:healthcare:vaccinations:0
  name: Vaccinations
  fullyQualifiedName: Healthcare Vaccinations
  domain: healthcare
  version: 0.1.0
  environment: development
  components:
    - id: urn:dmb:cmp:healthcare:vaccinations:0:mongodb-storage
      name: MongoDB Storage
      version: 0.0.0
```

**Derived component resource:** parse the component `id` into `(healthcare, vaccinations, 0, mongodb-storage)`, read `development` from `dataProduct.environment`, and build the canonical identity `(healthcare, vaccinations, 0, mongodb-storage, development)`. A provider-specific function may produce `healthcare-vaccinations-0-mongodb-storage-development-<hash>`. The hash is computed from the complete canonical identity before truncation. Neither display label participates.

**Data Product major-version infrastructure:** if one schema is shared by all components and environments of Data Product major version `0`, use `(healthcare, vaccinations, 0)` and document why environment and component are absent. A release change from `0.1.0` to `0.2.0` preserves the schema. A new major version changes the Data Product identity to `(healthcare, vaccinations, 1)` and produces a new schema.

**Rare component-versioned resource:** include component version only when, for example, two independently versioned component runtimes must coexist inside the same Data Product major version. The identity may then be `(healthcare, vaccinations, 0, scoring-service, component-version-2)`. Document why this resource does not follow only the normal Data Product major-version lifecycle.

**Resource shared across Data Product major versions:** an account-level namespace may intentionally omit Data Product major version because it is owned above any single Data Product and must be reused by majors `0` and `1`. Its identity might be `(account, region, namespace-purpose)`. Document who provisions it, how compatibility is maintained, and why undeploying one Data Product major version must not delete it.

**Descriptor-owned platform name:** if `specific.bucketName: company-vaccinations-dev` is part of the descriptor contract, that field is authoritative. The adapter validates the bucket syntax and uses the value unchanged in every lifecycle action. It must not independently derive another bucket name from `name`, `domain`, or the component identifier.

## Review Signals

### Existing Adapter Scan

Answer these questions for every named platform resource when attaching to an existing adapter:

1. Which platform objects are created, referenced, updated, polled, permissioned, and deleted by name or path?
2. Where is each name computed or read during every lifecycle action, including `updateAcl`, status polling, reverse provisioning, and cleanup?
3. Is the authority the template, descriptor, adapter configuration, deployment artifact or bundle, or adapter code?
4. What exact source fields form the canonical identity, in what order, and with which separators, prefixes, and suffixes?
5. Are any inputs mutable display labels? What happens after a descriptor rename?
6. What is the resource scope: global, account/project, environment, data product, component, subcomponent, version, principal, or shared?
7. Is Data Product major version present in the name or a parent scope so that a new major gets new infrastructure? If absent, is the resource explicitly and safely shared across major versions?
8. Is component version included? If so, what independent component lifecycle or coexistence requirement justifies this exception?
9. Are environment, region, tenant, account, or project encoded in the name, represented by a parent scope, or absent? Can required variants coexist?
10. What provider rules apply to case, characters, reserved values, leading and trailing characters, separators, and length?
11. What normalization is applied? Can two valid identities normalize to the same value, including through case folding, punctuation removal, Unicode handling, or ambiguous separators?
12. Is truncation deterministic, does it preserve the suffix, and is collision entropy appropriate for the expected scale?
13. Is the same naming implementation used by validation, creation, lookup, ACL updates, status, and deletion, or are formulas duplicated?
14. Does the adapter validate descriptor-owned names, or merely pass them to the provider?
15. Do templates, fixtures, docs, and deployment bundles express a convention that runtime code does not enforce?
16. Are artifact names being confused with runtime resource names?
17. Are platform IDs persisted when available, or are mutable names treated as identifiers?
18. Which naming decisions and migration constraints are documented, and which are only implicit in code or examples?
19. If a name is reused immediately after `unprovision`, can a provider soft-delete or retention window, or an external cache or reference still holding the old resource, make the recreated resource diverge from a genuine first-time resource under that name (see [Re-Provisioning Parity](./re-provisioning-parity.md))?

### Findings To Flag

- A final name cannot be traced to one authority and one canonical identity.
- Data Product major version is absent without an explicit cross-major shared-resource decision (see also [workload artifact contract](./workload-artifact-contract.md#review-signals)).
- Component version drives ordinary infrastructure naming without an independent component lifecycle requirement.
- Normalization is many-to-one but has no deterministic collision strategy.
- A name is truncated without reserving and preserving a hash suffix.
- Provider constraints are enforced only by a remote API call.
- Different lifecycle actions or generated artifacts use different formulas for the same resource.
- Structured identifiers are parsed by unchecked positional splitting.
- Unprovision or ACL cleanup depends only on a mutable display name.
- A naming convention exists only in test fixtures or template defaults and is not validated by the adapter.
- Shared resources, versioned resources, and principal-specific resources are not distinguished.
- A name is reused immediately after `unprovision` without checking provider soft-delete, retention, or purge windows that could make the reused name resolve to stale state.

## Test Coverage

Use table-driven unit tests for each naming function and contract tests at the lifecycle boundary. Cover at least:

- a representative canonical identity with the exact expected name;
- minimum and maximum permitted lengths;
- mixed case, spaces, punctuation, separators, Unicode, and provider-reserved forms;
- leading and trailing invalid characters;
- malformed or incomplete structured identifiers;
- two distinct identities that normalize to the same readable prefix;
- truncation at, below, and above the boundary, with a stable preserved hash suffix;
- identical inputs producing identical names across repeated calls;
- a Data Product major-version change producing distinct infrastructure names by default;
- minor and patch Data Product version changes preserving infrastructure names by default;
- component-version changes preserving names unless independent component versioning is explicitly required;
- intentional cross-major shared resources preserving names, with lifecycle tests proving that undeploying one major does not delete a resource still used by another;
- environment, component, and principal changes producing either distinct or intentionally shared names according to the scope decision;
- the same resolved name being used by validate, provision, status, unprovision, reverse provisioning, and `updateAcl`;
- descriptor-owned names being accepted or rejected without mutation;
- rename behavior and discovery or cleanup of resources created under the previous convention.
- immediate name reuse after `unprovision`, asserting the recreated resource is not affected by a provider soft-delete or retention window.

Tests must assert the resulting name, not only that the provider client was called. When naming is delegated to a template, CI artifact, or deployment bundle, add a contract fixture that proves its output satisfies the adapter's documented assumptions.
