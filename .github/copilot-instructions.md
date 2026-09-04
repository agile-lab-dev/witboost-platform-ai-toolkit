# Witboost AI Toolkit Repository

This repository publishes domain-oriented Agent Skills and a separate workspace CLI.

## Rules

- Edit canonical skills under `skills/` and keep them self-contained.
- Treat `core/` as an authoring contract, not a runtime dependency.
- Keep template and policy packs explicitly incomplete until their contracts are designed.
- Keep optional native agents as thin wrappers around one skill.
- Run `make validate` after changing skills or CLI behavior.
