---
name: witboost-policy
description: "Develop the lifecycle of Witboost policies. This pack currently defines only repository and ownership boundaries; use it to scope future policy work, not to invent or implement policy behavior."
metadata:
  internal: true
---

# Witboost Policy

## Status

This domain pack is intentionally incomplete. Its structure reserves the policy lifecycle boundary while requirements are collected.

## Repository Contract

- Policy repositories live under `policies/<repository>/`.
- A policy may own evaluation rules, inputs, outcomes, diagnostics, and remediation guidance.
- A policy must not silently take ownership of resource reconciliation or repository scaffolding.
- Policy implementation and decisions stay in the policy repository.

## Lifecycle

The domain will provide playbooks for `create`, `assess`, `design`, `evolve`, `review`, `implement`, and `validate`.

Until those playbooks are defined:

1. Identify the target and related repositories.
2. Capture desired business behavior, enforcement point, and ownership boundaries.
3. Record open design questions.
4. Stop before implementation or validation claims.
