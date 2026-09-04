---
name: witboost-toolkit
description: "Route work across the lifecycle of Witboost tech adapters, templates, and policies. Use when the target entity is unclear, multiple entity types are involved, or common workspace and decision rules are needed."
argument-hint: "Describe the Witboost entity, repository, and desired lifecycle outcome."
---

# Witboost Toolkit

## Purpose

This is the lightweight entry point for Witboost asset development. It selects a domain pack and lifecycle phase; it does not replace domain-specific guidance.

## Route By Entity

| Entity | Repository location | Domain skill | Availability |
| --- | --- | --- | --- |
| Tech adapter | `tech-adapters/<repository>/` | `witboost-tech-adapter` | Complete |
| Template | `templates/<repository>/` | `witboost-template` | Structure only; requirements are not defined yet |
| Policy | `policies/<repository>/` | `witboost-policy` | Structure only; requirements are not defined yet |

If the request spans entities, identify one primary target repository and list the contracts with the related repositories before proceeding.

## Route By Lifecycle

Use the domain pack's concrete playbook for the requested phase:

1. `create`: establish a new independently versioned repository from an approved source.
2. `assess`: reconstruct undocumented behavior from repository evidence.
3. `design`: establish architecture, ownership, and lifecycle scope.
4. `evolve`: define a new capability or behavioral change.
5. `review`: identify defects, risks, missing decisions, and missing tests.
6. `implement`: apply an agreed design with the smallest viable patch.
7. `validate`: exercise the implemented contract at the appropriate level.

Do not force every domain to implement these phases identically. The common names describe intent; each domain owns its operational contract.

## Common Rules

- Read [Workspace Model](./references/workspace-model.md) before choosing a repository.
- Apply [Evidence And Decisions](./references/evidence-and-decisions.md) when reconstructing, designing, or reviewing behavior.
- Never invent domain behavior when its pack is marked as structure only. Record the missing scope and stop before implementation.
- Keep source code and decisions in the independently versioned repository that owns the behavior.

## Output

Report the selected entity, target repository, lifecycle phase, domain skill, evidence used, decisions made, and unresolved risks.
