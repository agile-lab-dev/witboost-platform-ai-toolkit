# Resource Identity And Naming

## Concept

Every provider object created, looked up, updated, permissioned, polled, or deleted by an adapter needs one reproducible identity and one naming authority. A canonical identity is the ordered set of stable inputs that distinguishes the resource. A provider-specific naming function may convert that identity into a valid name.

Two ownership models are valid:

- **Descriptor-owned final name:** the component contract supplies the exact provider name. The adapter validates and uses it unchanged.
- **Adapter-derived name:** the descriptor supplies stable identity inputs and the adapter applies an accepted derivation.

Configuration may supply a parent account, project, namespace, prefix, or suffix without silently replacing descriptor-owned identity.

## Design Decision

For each named provider resource:

1. Choose one naming authority: descriptor-owned final name or adapter-derived name.
2. Define the ordered canonical identity and the authoritative source of every field.
3. Define scope: global, account/project, environment, Data Product, component, subcomponent, version, principal, or shared.
4. Define provider constraints: characters, case, reserved forms, separators, leading/trailing rules, and length.
5. For derived names, define canonical serialization before normalization or hashing.
6. Define normalization and whether it is lossy.
7. Define collision handling and truncation behavior. A deterministic hash suffix is recommended when readable normalized prefixes can collide, but it is not mandatory when another proven strategy exists.
8. Define ownership verification before adopting, changing, or deleting an existing name.
9. Define migration, lookup, and cleanup for resources created under earlier naming rules.
10. Define whether provider-assigned immutable IDs are persisted or returned in provisioning information.
11. Define precedence among persisted/provisioning identifiers, descriptor-derived identity, and current configuration for actions that target an existing resource. This is a Target Decision; the toolkit imposes no universal order.

## Recommendations

- Use stable machine identifiers rather than mutable display names or free-form labels.
- Parse structured identifiers with the installed-version descriptor model or a validated parser, never unchecked positional splitting.
- Keep artifact coordinates and provider resource names as separate contracts.
- Apply deterministic operations in a documented order: canonical serialization, normalization, collision handling, truncation, then provider validation.
- Compute any collision digest from the full canonical identity, use a documented algorithm/version, and reserve suffix space before truncation.
- Avoid PII in resource names. Use stable opaque principal identifiers when principal-specific resources are unavoidable.
- Verify ownership metadata before reconciling a pre-existing provider name; name equality alone does not prove ownership.
- Reuse the same naming implementation or persisted provider identity across all actions touching the same resource.

## Review Signals

- A final name cannot be traced to one authority and canonical identity.
- Different lifecycle actions use different formulas for the same resource.
- Mutable display labels or unvalidated user input drive machine identity.
- Structured identifiers are parsed through unchecked positional splitting.
- Lossy normalization has no accepted collision strategy.
- Truncation discards the distinguishing suffix or uses an undocumented hash input/algorithm.
- Descriptor-owned final names are silently normalized or rebuilt.
- Existing resources are adopted or deleted by name without ownership verification.
- Existing-resource lookup uses different precedence across status, unprovision, and `updateAcl`, or silently ignores conflicting evidence.
- Shared, versioned, environment-specific, and principal-specific scopes are not distinguished.
- Naming changes leave existing resources undiscoverable or unsafe to clean up.
- Names expose unnecessary user or group PII.

## Test Coverage

- Representative canonical identities with exact expected provider names.
- Minimum and maximum lengths, reserved forms, invalid leading/trailing characters, case, spaces, punctuation, separators, and Unicode.
- Malformed or incomplete structured identifiers.
- Distinct identities that normalize to the same readable value.
- Truncation boundaries and stable collision suffixes when that strategy is selected.
- Identical inputs producing identical identities across repeated calls and lifecycle actions.
- Descriptor-owned final names accepted or rejected without mutation.
- Ownership mismatch preventing adoption or deletion.
- Intended scope changes producing distinct or intentionally shared names.
- Migration lookup and cleanup for the previous naming algorithm/version.
- PII minimization for principal-specific resources.
