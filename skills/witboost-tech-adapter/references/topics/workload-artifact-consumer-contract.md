# Workload Artifact Consumer Contract

## Scope

This contract applies when a Tech Adapter provisions a workload using a release produced by the related workload template. Read the [Workload Artifact Producer Contract](./workload-artifact-producer-contract.md) first for the expected upstream output.

The Tech Adapter consumes and deploys the release. It does not redefine or locally compile the workload template's business-logic contract inside the adapter process.

## Delivery Modes

| Mode | Adapter responsibility |
| --- | --- |
| Published package or bundle | Resolve the selected package, verify expected identity and digest when available, and stage or pass it to the provider. |
| Released source revision | Resolve or accept the selected Git revision and configure the target platform to use it. |
| Provider-managed build | Submit an immutable source identity plus the accepted build/runtime configuration; observe the resulting provider deployment. |
| Existing control-plane object | Configure or trigger the provider object with the selected release and retain its provider identifiers. |

A provider-managed build is valid when its input source identity and build configuration are reproducible. Running an undeclared local build of workload business logic inside the Tech Adapter is not equivalent.

## Design Decision

For each workload integration, decide:

1. Authoritative release selector and where it appears in the descriptor or Witboost metadata.
2. Whether selectors may be mutable. If allowed, define resolution timing and exact behavior for retry, status, rollback, and unprovision; this toolkit imposes no default policy.
3. Immutable identity retained for the deployed release: digest, object version, commit, provider revision, or accepted combination.
4. Whether digest verification is available and required. Digest integrity is sufficient for this generic toolkit; additional publisher signature or attestation is outside this contract unless selected by the target.
5. Required and optional artifact members and how their completeness is verified.
6. Adapter mode: fetch-and-stage, immutable reference pass-through, provider-managed build, or existing control-plane deployment.
7. Atomic staging/promotion and last-known-good behavior.
8. Retention and cleanup for staged releases, failed deployment, rollback, replacement, and unprovision.
9. Provisioning information and provider identifiers needed by status and unprovision under the adapter's accepted configuration model.

Archive extraction hardening is delegated to the selected implementation/library and is outside this generic contract. If the adapter extracts archives itself, review that implementation using the target repository's security requirements.

## Recommendations

- Resolve one selector to one deployable release and fail ambiguity.
- Verify digest or immutable source identity before activation when available.
- Verify all required members before deleting, overwriting, or switching the active release.
- Stage and validate before atomic promotion where the provider supports it.
- Distinguish desired selector from observed running digest, commit, or provider revision.
- Keep enough non-secret evidence to identify what was deployed and clean up the correct provider object.
- Use provider-reported state rather than successful API submission as proof that the selected release is running.

## Review Signals

- The adapter deploys a first or arbitrary registry match instead of one selected release.
- Selector semantics disagree with the workload template producer contract.
- Retry, status, rollback, or unprovision resolves a mutable selector contrary to the accepted target decision.
- Digest or immutable source identity is available but never verified or retained.
- A successful submission is reported as successful deployment without observing provider state.
- Required artifact members can be missing, duplicated, or mixed across versions.
- Replacement deletes the active release before the candidate is complete.
- A provider-managed build uses a mutable or unidentified source despite claiming reproducibility.
- The adapter compiles workload business logic locally without an explicit target contract.
- Cleanup or unprovision cannot identify which staged or provider release belongs to the component.

## Test Coverage

- Zero, one, and multiple selector matches.
- Immutable and mutable selector behavior according to the accepted target decision.
- Digest or immutable source mismatch.
- Required, optional, missing, duplicate, and unexpected executable members according to the producer manifest.
- Atomic candidate staging and promotion.
- Failure before and after provider submission without mixed active state.
- Provider-managed build from exact immutable source identity and accepted configuration.
- Desired selector versus observed running identity in status/provisioning information.
- Retry, rollback, replacement, and unprovision using the accepted release-resolution policy.
- Retention and cleanup of staged artifacts and provider objects.
- Contract fixture generated by the workload template producer flow.
