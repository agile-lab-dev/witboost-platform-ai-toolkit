# Witboost Toolkit Core

This directory defines conventions shared by all Witboost domain packs.

Domain skills must remain self-contained because skill installers may install one skill without its siblings. Shared semantics are authored here first, then embedded in each affected domain pack and checked by repository tests.

## Asset Lifecycle

The common lifecycle vocabulary is:

1. `create`
2. `assess`
3. `design`
4. `evolve`
5. `review`
6. `implement`
7. `validate`

These names express intent, not identical implementation. Every domain pack defines its own evidence, ownership, deliverables, and validation contract.

## Repository Ownership

- The workspace groups assets and shared tooling.
- Every asset remains in an independently versioned repository.
- Decisions and implementation stay in the repository that owns the behavior.
- Cross-asset changes identify one primary repository and make integration contracts explicit.

## Domain Packs

| Domain | Skill | Status |
| --- | --- | --- |
| Tech adapter | `witboost-tech-adapter` | Complete |
| Template | `witboost-template` | Structure only |
| Policy | `witboost-policy` | Structure only |

`witboost-toolkit` is the cross-domain router.
