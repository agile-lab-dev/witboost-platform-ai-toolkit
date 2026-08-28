# High-Level Design Brief

Write this to `docs/HLD.md` in the target adapter repository. Skip the generic explanation of what a tech adapter is (Coordinator, Component Descriptor, the five lifecycle operations) — that is not adapter-specific and is not the goal here.

Fill only the sections that have been answered or reconstructed so far; leave the rest under "Open Sections" instead of guessing.

## Overview

- Target platform or system:
- Witboost component type(s) provisioned and their target-platform mapping:
- Conceptual summary of what this adapter offers:

## Lifecycle Coverage

| Operation | In scope | Narrative status |
| --- | --- | --- |
| `validate` | yes/no |  |
| `provision` | yes/no |  |
| `unprovision` | yes/no |  |
| `updateAcl` | yes/no |  |
| `reverseProvision` | yes/no |  |

## Operation Narratives

One subsection per in-scope operation.

### `<operation>`

- Narrative: short, conceptual description of what happens — not the fine-grained decisions from [New Feature](../references/playbooks/new-feature.md).
- Requirements: technical user, credentials, or permissions needed.
- Diagram: optional; link it here once added, otherwise state "not yet added".

## Open Sections

List every section or operation still undocumented, unconfirmed, or pending user review, so a later session can resume directly instead of restarting.
