# High-Level Design Playbook

Use to establish or extend a tech adapter's architecture-level scope before defining a [new feature](./new-feature.md). This is the antidote to a blank-page start: it produces a short, mostly-templated `docs/HLD.md` instead of asking the user to describe an entire adapter from nothing.

Recommended, not mandatory. The user may explicitly skip it; if so, proceed directly to the requested phase and record the missing architectural baseline as an open risk instead of silently continuing as if it existed.

## When To Run

- `new adapter`, once bootstrapped, before designing its first capability, when `docs/HLD.md` does not exist yet.
- `attach existing adapter`, when `docs/HLD.md` does not exist, or exists but does not cover the component type or lifecycle operation the requested change touches.

Skip straight to [New Feature](./new-feature.md) when `docs/HLD.md` already covers the requested scope.

## No Prior Code Or High-Level Design (New Scope)

This is an iterative process across turns and sessions, not a single questionnaire — do not ask everything at once and do not wait for a complete answer set before saving progress.

1. Ask a small, focused set of questions at a time. Cover, over as many turns as needed:
   - the target platform or system and, at a conceptual level, how it manages the resources involved;
   - which Witboost component type(s) the adapter provisions and what each maps to on the target platform;
   - which lifecycle operations are in scope (`validate`, `provision`, `unprovision`, `updateAcl`, `reverseProvision`) and, for each one, a short conceptual narrative of what it does — not the fine-grained decisions from [New Feature](./new-feature.md);
   - the technical user, credentials, or permissions each in-scope operation needs.
2. Diagrams are optional for now; do not block on them. Note where one would go and add it later if the user wants one.
3. After each round of answers, write or update `docs/HLD.md` using the [High-Level Design brief](../../assets/high-level-design-brief.md) immediately, covering only what has been answered, and explicitly list what is still open so a later turn or session can resume without re-asking.

## Existing Code, Missing Or Incomplete High-Level Design

Do not interview the user for behavior that already exists. Reconstruct the narrative directly from routes, descriptor models, and tests — the same evidence used in [attach](./attach.md) — draft `docs/HLD.md` from that evidence using the [High-Level Design brief](../../assets/high-level-design-brief.md), and then ask the user to review and correct the draft. A reconstructed draft is an inference, not a confirmed decision, until the user confirms it.

## Deliverable

[High-Level Design brief](../../assets/high-level-design-brief.md), written to `docs/HLD.md` in the target adapter repository.
