# New Feature Playbook

Use for new capabilities and customization.

If the requested capability or component type is not yet covered by `docs/HLD.md` (or no HLD exists at all), the [High-Level Design playbook](./high-level-design.md) — recommended but skippable — establishes that architecture-level scope first; this playbook then works out the fine-grained behavior within it.

1. Read the relevant target API, implementation, tests, HLD, and locked decisions to establish current behavior and compatibility boundaries.
2. Check whether the request specifies the desired **business behavior**, not just a capability or lifecycle action name. "Implement updateAcl", "add provisioning for X", or "support deletion" name a target; they are not a specification.
3. Ask only about decisions not answered by repository evidence or the product contract. Use the implicated topic's `Design Decisions` as a checklist. For `updateAcl`, ask how principals and permissions map, which grants are protected versus managed, and how partial failures are handled. Do not silently invent target-specific behavior.
4. State the desired behavior and compatibility boundary.
5. Read each implicated topic and resolve its required design decisions, reconciling the user's stated behavior with best practice and prior decisions; surface conflicts back to the user instead of silently overriding either side.
6. Produce a [feature design](../../assets/feature-design.md) containing desired behavior, compatibility boundary, affected ownership, accepted decisions, open proposals, and test impact. Add a lifecycle map only when actions, execution modes, or support endpoints change. Use the full [test matrix](../../assets/test-matrix.md) when scenarios need to be designed or recorded.
7. Keep proposed options and unrelated open questions in the feature design. For each accepted durable decision, append one cohesive entry to `docs/decisions/DECISIONS.md` using the [decision log entry](../../assets/decision-log-entry.md).
8. If an accepted decision changes components, ownership, lifecycle scope, flows, integrations, or invariants, update `docs/HLD.md` in the same change.
9. When changing a prior decision, append a new accepted entry whose `Supersedes` field references the prior `YYYY-MM-DD-slug`. Do not modify the prior entry.
10. If the change affects descriptor fields or validation for a supported component kind, update its confirmed `docs/reference-descriptors/<kind>.yaml`; draft and obtain confirmation before introducing a new kind.

Do not require every decision to be answered before making progress. Ask a small, focused set of questions at a time and persist only accepted durable decisions.

This phase defines the feature; it does not implement it.
