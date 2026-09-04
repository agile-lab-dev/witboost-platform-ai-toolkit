# Assessment Playbook

Use when an existing implementation's contract is not documented well enough for the requested work. Do not assess merely because the toolkit did not create the repository.

1. Use the current repository when it is a Tech Adapter; otherwise resolve it from a configured workspace or an explicit path.
2. Read `docs/decisions/DECISIONS.md` and `docs/HLD.md` when present.
3. Inspect routes, OpenAPI, descriptor models, configuration, scripts, tests, deployment manifests, and docs without executing them.
4. Reconstruct the lifecycle actions and implementation relevant to the requested scope. Assess the whole repository only when explicitly requested.
5. Update `docs/assessment/ASSESSMENT.md` using the [assessment report](../../assets/assessment-report.md). This is the current evidence report, not a decision history; replace its scoped observations as evidence changes.
6. Report contradictions and evidence gaps before proposing changes. Observed behavior is evidence, not an approved decision.
7. When implementation and HLD disagree, present both with their evidence and ask the user which contract is intended. Do not align either one automatically.
8. If the user resolves and accepts an architectural discrepancy, update `docs/HLD.md` and append the accepted decision to `docs/decisions/DECISIONS.md`.
9. The repository invariant is one valid, realistic internal descriptor at `docs/reference-descriptors/<kind>.yaml` for every supported component kind, where `<kind>` is a stable slug derived from the descriptor's component kind. In a targeted assessment, verify only kinds inside the requested scope and mark all others as `not verified`; do not expand the assessment to validate them.
10. If an in-scope descriptor is missing or no longer matches the observed contract, reconstruct a draft from models and tests, present it as unconfirmed, and ask the user to approve it before writing. Never infer secret values; use representative non-sensitive values. Negative and malformed variants belong in test fixtures, not in the reference descriptor.
