# Witboost Resource Identity Profile

## Product Context

Apply this profile when deriving provider identity from a Witboost Data Product or component descriptor. Use the schema and structured identifiers defined by the OpenAPI and descriptor model for the installed Witboost version.

The default Witboost policy is that the Data Product major version participates in infrastructure identity: a new major version represents a new Data Product identity and normally receives distinct infrastructure. Minor and patch releases normally reuse that major-version infrastructure. A shared cross-major resource is an explicit Target Decision with higher-level ownership and cleanup rules.

## Design Decision

1. Define which installed-version descriptor fields supply domain, Data Product, major version, component, environment, and component-version identity.
2. Include Data Product major version by default. For each exception, record the shared owner, coexistence guarantees, provisioning responsibility, and cleanup behavior.
3. Include component version only when independently versioned component resources must coexist inside one Data Product major version.
4. Decide whether environment belongs in the provider name, an operator-owned parent scope, or is intentionally absent.
5. Treat `componentIdToProvision` as an exact selector for the component, not as a second naming authority.
6. Treat `name` and `fullyQualifiedName` as display fields unless the installed descriptor contract explicitly makes one stable and unique.
7. When `specific` contains a final provider name, validate and use it unchanged.

## Recommended Sources

| Identity input | Preferred source |
| --- | --- |
| Domain and Data Product identity | Parsed Data Product identifier from the installed descriptor model |
| Data Product major version | Parsed Data Product/component identifiers, cross-checked for consistency |
| Full Data Product version | `dataProduct.version`, normally for release semantics rather than provider identity |
| Component identity | Exact selected component identifier |
| Component version | Installed-version component field, only for an accepted independent component lifecycle |
| Environment | Descriptor environment, represented in the name or physical parent scope according to the target decision |
| Final provider name | Typed `specific` field when the component contract owns the final name |
| Account, project, region, namespace | Logical descriptor intent and adapter mapping according to the accepted authority boundary |

## Review Signals

- Data Product major version is absent without an accepted shared-resource decision.
- Component version drives ordinary infrastructure identity without an independent coexistence requirement.
- Domain, Data Product, component, or major version is extracted using assumptions incompatible with the installed descriptor version.
- `componentIdToProvision` is not matched exactly.
- Display names are treated as immutable machine identifiers.
- Environment or physical target scope is omitted or duplicated without a coexistence decision.
- A descriptor-owned final provider name is changed by adapter derivation.

## Test Coverage

- New Data Product major version produces distinct infrastructure identity by default.
- Minor and patch Data Product versions preserve infrastructure identity by default.
- Explicit cross-major shared resources preserve identity and survive cleanup of one major.
- Component-version changes preserve identity unless independent coexistence is accepted.
- Exact component selection and consistency between Data Product/component identifiers.
- Environment and physical target variants follow the accepted scope decision.
- Descriptor-owned provider names remain unchanged after validation.
