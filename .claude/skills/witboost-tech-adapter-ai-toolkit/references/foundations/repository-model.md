# Repository Model

## Two Repository Modes

### `new adapter`

Bootstrap a separate target repository from the Java or Python Witboost scaffold, then reconstruct its contract using the same mechanics as `attach existing adapter` against that repository. The reported mode stays `new adapter` for this repository going forward — a repository that was bootstrapped through this workflow is never re-labeled `attach existing adapter` just because a later session works against it. Reserve that label for a repository this workflow did not create.

### `attach existing adapter`

Inspect an existing target adapter repository — one this workflow did not bootstrap — and recover its actual contract before designing, reviewing, implementing, or testing changes.

## Repository Boundaries

- **Workflow host repository:** contains this agent, skill, references, and assets.
- **Target adapter repository:** contains the deployable tech adapter and is the source of truth for current behavior.
- **Template repository:** may scaffold repositories and metadata, but does not own runtime provisioning.
- **Descriptor source:** defines portable desired state consumed by Witboost and the adapter.

Never implement target adapter behavior in the workflow host. Always state the mode, workflow host, target adapter, related template, and descriptor source before proceeding.

For `new adapter`, the target repository does not exist yet at the start of
the conversation, so it must be bootstrapped at a path outside the workflow
host before anything else happens — see the
[bootstrap playbook](../playbooks/bootstrap.md). Once bootstrapped, the
current chat session cannot keep operating against it: the user must open
that path as its own workspace or window and continue the conversation there.

## Contract Recovery

Once a target repository exists, inspect its routes, OpenAPI contract, descriptor models, configuration, scripts, tests, deployment manifests, and documentation, including `docs/HLD.md` when present as the architecture-level source of truth. Read `docs/decisions/DECISIONS.md` when present for point-in-time decisions. Treat implementation evidence, the HLD, and locked decisions as authoritative; report contradictions instead of silently choosing one.