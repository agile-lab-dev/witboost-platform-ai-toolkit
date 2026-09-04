# Reverse Provisioning

## Protocol Contract

Reverse provisioning imports the current state of an existing target resource into Witboost. The installed-version Tech Adapter OpenAPI defines the request, result, and optional asynchronous status contract.

For the latest public API, the request includes `useCaseTemplateId`, `environment`, optional `params`, and optional `catalogInfo`; a terminal result contains descriptor `updates`, while asynchronous execution returns a token polled through the dedicated reverse-provisioning status route.

Source: [Witboost Tech Adapter API](https://docs.witboost.com/docs/apis/extension-points/control-plane/builder/tech-adapter-api), reverse provisioning operations.

Verify these fields and routes against customer-local OpenAPI for older installations.

## Design Decision

1. Define how `params` identify or search for the existing provider resource.
2. Define which target accounts, tenants, environments, and resource types may be imported.
3. Define how the adapter verifies resource existence and caller authority without mutating it.
4. Define the mapping from observed provider state to allowed descriptor `updates` for the selected `useCaseTemplateId`.
5. Define how `catalogInfo` is consumed, preserved, or rejected and how conflicts with observed state are handled.
6. Define which fields cannot be imported because they are secret, installation-specific, unsupported by the template, or not safely observable.
7. Select sync or async behavior from the installed-version contract and apply the accepted status, retention, and recovery decisions.
8. Define behavior when multiple provider resources match, none match, or the resource changes during import.

Reverse provisioning observes and maps existing state. It must not silently provision, modify, adopt ownership of, or delete the target resource unless a separate explicit lifecycle action is invoked.

## Recommendations

- Require an unambiguous resource match and return actionable ambiguity or not-found errors.
- Authorize target discovery and read access before exposing whether a resource exists.
- Return the smallest descriptor update set needed by the selected template.
- Exclude credentials, secret values, physical endpoints, and operator-only configuration from descriptor updates.
- Validate generated updates against the component/template contract before returning success.
- Record enough non-secret provider identity to explain what was imported without treating reverse provisioning as ownership transfer.
- Detect concurrent target changes where the provider offers version or etag checks.

## Review Signals

- `params` permit arbitrary cross-tenant discovery or endpoint selection.
- Resource matching selects the first result or tolerates ambiguity.
- Unauthorized users can use errors to enumerate provider resources.
- Reverse provisioning performs writes or claims ownership as a side effect.
- Returned updates contain secrets, physical connectivity, unsupported paths, or fields outside the selected template contract.
- `catalogInfo` silently overrides observed state or is discarded despite being contractually relevant.
- Async reverse provisioning uses the generic status route when the installed OpenAPI defines a dedicated route.
- The adapter reports success without validating the returned updates.

## Test Coverage

- Exact, missing, unauthorized, and ambiguous resource discovery.
- Allowed and rejected target account/environment/resource-type combinations.
- Mapping representative observed state to valid descriptor updates.
- Conflict handling between `catalogInfo`, `params`, and provider observations.
- Secret, endpoint, and operator-configuration exclusion.
- No provider mutation during reverse provisioning.
- Concurrent provider-state change during import when detectable.
- Sync terminal result or async acceptance/status according to the installed-version OpenAPI.
- Returned updates validated against the selected template/component contract.
