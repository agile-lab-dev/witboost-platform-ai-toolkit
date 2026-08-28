# Attach Playbook

Use for every target repository, including a freshly bootstrapped adapter —
in that case the reported mode stays `new adapter` (see the
[bootstrap playbook](./bootstrap.md)); only a repository that was never
bootstrapped through this workflow is reported as `attach existing adapter`.

Exception: do not run this full playbook against a repository that is still
the untouched scaffold (only the bootstrap commit, nothing changed since).
That outcome is already known from the scaffold itself, so bootstrap.md's
lightweight-check shortcut applies instead — see bootstrap.md steps 6-7.

1. State repository mode, workflow host, target adapter, related template, and descriptor source.
2. Read prior decisions in `docs/decisions/DECISIONS.md` when present, and `docs/HLD.md` when present as the architecture-level source of truth.
3. Inspect (read only) routes, OpenAPI, request and descriptor models, configuration, scripts, tests, deployment manifests, and docs. Do not execute the test suite or scripts during reconstruction; reading them is sufficient evidence.
4. Reconstruct every lifecycle action and identify the implementation that controls its behavior.
5. Select the topic scans relevant to the adapter and complete the [attach report](../../assets/attach-report.md).
6. Persist a [decision log entry](../../assets/decision-log-entry.md) in `docs/decisions/DECISIONS.md` that mirrors every topic covered by the attach report: lock the topics the evidence conclusively supports, and record the remaining ones as explicitly open with their risk instead of leaving them unrecorded. Do this even when open questions remain — an entry with open topics is the valid closing deliverable of an attach session, not something to withhold until every question is answered.
7. Report evidence gaps and contradictions before proposing changes.
8. When `docs/HLD.md` is missing, or does not cover an area implicated by the requested change, recommend (skippable) the [High-Level Design playbook](./high-level-design.md) — reconstruct it from evidence rather than interviewing the user, since the behavior already exists, and present the draft for the user to review.