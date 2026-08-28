# New Feature Playbook

Use for new capabilities and customization.

If the requested capability or component type is not yet covered by `docs/HLD.md` (or no HLD exists at all), the [High-Level Design playbook](./high-level-design.md) — recommended but skippable — establishes that architecture-level scope first; this playbook then works out the fine-grained behavior within it.

1. Check whether the request already specifies the desired **business behavior**, not just a capability or lifecycle action name. "Implement updateAcl", "add provisioning for X", or "support deletion" name a target; they are not a specification.
2. If the business behavior is not yet specified, stop and ask the user before reading decisions, best practices, or the target contract. Use the implicated topic's `Design Decision` questions as the checklist of what is missing — for example, for `updateAcl`: is the request desired-state or delta, how are principals and permissions mapped, which grants are protected versus managed, what happens on an empty desired set or partial failure. Ask about the actual scenario (who, what, when, edge cases, ownership), not about which best practice to apply. Do not silently default these from best practices or invent them on the user's behalf.
3. Only once the desired behavior is stated by the user — or the user explicitly defers a specific open point to your judgment — start from the reconstructed target contract and prior locked decisions to validate it.
4. State the desired behavior and compatibility boundary.
5. Read each implicated topic and resolve its required design decisions, reconciling the user's stated behavior with best practice and prior decisions; surface conflicts back to the user instead of silently overriding either side.
6. Produce a lifecycle map, ownership table, decision draft, and test matrix.
7. Before ending the session, record decisions in `docs/decisions/DECISIONS.md` using the [decision log entry](../../assets/decision-log-entry.md): lock the ones resolved in this session and explicitly list the ones still open, with their risk. Persist this entry even if the session ends with open questions — do not wait until every topic is resolved.
8. When changing a prior decision, append a superseding entry and explain the migration or compatibility effect.

New Feature, like High-Level Design, is normally a multi-turn conversation, not a single exchange — do not require every decision to be answered before making progress. Ask a small, focused set of questions at a time, persist what is resolved immediately (step 7), and let later turns or sessions pick up the remaining open items.

This phase defines the feature; it does not implement it.