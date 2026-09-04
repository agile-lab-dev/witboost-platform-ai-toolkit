---
name: witboost-template
description: "Develop the lifecycle of Witboost templates. This pack currently defines only repository and ownership boundaries; use it to scope future template work, not to invent or implement template behavior."
metadata:
  internal: true
---

# Witboost Template

## Status

This domain pack is intentionally incomplete. Its structure reserves the template lifecycle boundary while requirements are collected.

## Repository Contract

- Template repositories live under `templates/<repository>/`.
- A template may own scaffolding, initial metadata, generated files, and user-facing parameters.
- A template must not silently take ownership of runtime provisioning that belongs to a tech adapter or another runtime component.
- Template implementation and decisions stay in the template repository.

## Lifecycle

The domain will provide playbooks for `create`, `assess`, `design`, `evolve`, `review`, `implement`, and `validate`.

Until those playbooks are defined:

1. Identify the target and related repositories.
2. Capture desired business behavior and ownership boundaries.
3. Record open design questions.
4. Stop before implementation or validation claims.
