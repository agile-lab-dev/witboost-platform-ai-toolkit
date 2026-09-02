# Assessment Playbook

Use when an existing implementation's contract is not documented well enough for the requested work. Do not assess merely because the toolkit did not create the repository.

1. Identify the target repository under `tech-adapters/`.
2. Read `docs/decisions/DECISIONS.md` and `docs/HLD.md` when present.
3. Inspect routes, OpenAPI, descriptor models, configuration, scripts, tests, deployment manifests, and docs without executing them.
4. Reconstruct every lifecycle action and the implementation that controls it.
5. Complete the relevant sections of the [assessment report](../../assets/assessment-report.md).
6. Create or update `docs/reference-descriptor.yaml` for every supported component kind.
7. Persist conclusive and open decisions in `docs/decisions/DECISIONS.md`.
8. Report contradictions and evidence gaps before proposing changes.