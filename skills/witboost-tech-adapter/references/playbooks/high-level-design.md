# High-Level Design Playbook

Use to establish or extend a tech adapter's architecture-level scope before defining a [new feature](./new-feature.md). This is the antidote to a blank-page start: it produces a short, mostly-templated `docs/HLD.md` instead of asking the user to describe an entire adapter from nothing.

Recommended, not mandatory. The user may explicitly skip it; if so, proceed directly to the requested phase and record the missing architectural baseline as an open risk instead of silently continuing as if it existed.

## When To Run

- A newly created adapter before its first capability, when `docs/HLD.md` does not exist yet.
- An existing adapter when `docs/HLD.md` does not cover the component type or lifecycle operation being changed.

Skip straight to [New Feature](./new-feature.md) when `docs/HLD.md` already covers the requested scope.

## No Prior Code Or High-Level Design (New Scope)

This is an iterative process, not a single questionnaire. Ask a small set of questions at a time.

1. Ask a small, focused set of questions at a time. Cover, over as many turns as needed:
   - the target platform or system and, at a conceptual level, how it manages the resources involved;
   - which Witboost component type(s) the adapter provisions and what each maps to on the target platform;
   - which lifecycle actions are supported (`validate`, `provision`, `unprovision`, `updateAcl`, `reverse provisioning`) for the installed Tech Adapter API version and, for each one, a short conceptual narrative of what it does;
   - which actions are synchronous or asynchronous and which status or termination endpoints support them;
   - the technical identity, authentication mechanism, and permission scopes each in-scope operation needs, never credential values.
2. Diagrams are optional for now; do not block on them. Note where one would go and add it later if the user wants one.
3. After each architectural decision is explicitly accepted, update `docs/HLD.md` using the [High-Level Design brief](../../assets/high-level-design-brief.md) and append one cohesive entry to `docs/decisions/DECISIONS.md`. Include only architecture-level concerns: components, ownership, lifecycle scope, flows, integrations, and invariants. Keep proposals and open sections in the HLD as unconfirmed context only when useful; never record them as accepted decisions.

## Existing Code, Missing Or Incomplete High-Level Design

Do not interview the user for behavior that already exists. Reconstruct the narrative directly from routes, descriptor models, and tests using the [assessment playbook](./assess.md), return a draft based on the [High-Level Design brief](../../assets/high-level-design-brief.md), and ask the user to review it. A reconstructed draft is an inference: do not write it to `docs/HLD.md` until the user confirms the intended architecture. Once confirmed, update the HLD and append the decision log entry automatically.

## Deliverable

[High-Level Design brief](../../assets/high-level-design-brief.md), written to `docs/HLD.md` in the target adapter repository.
