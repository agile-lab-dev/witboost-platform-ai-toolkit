# Witboost AI Toolkit Development

This repository publishes domain-oriented Agent Skills and a separate workspace CLI.

- Edit canonical skills under `skills/`.
- Keep each skill self-contained and progressively disclose detailed references.
- Treat `core/` as the shared conceptual contract, not as a runtime skill dependency.
- Keep `witboost-policy` explicitly incomplete until its contract is designed.
- Optional native agents must be thin wrappers around one domain skill.
- Run `make validate` after changing skills or CLI behavior.
