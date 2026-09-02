# Repository Model

## Witboost Workspace

The toolkit is configured once in a folder that contains independently versioned Witboost assets:

```text
witboost-workspace/
├── agents/ and skills/
├── scripts/
├── tech-adapters/<adapter-repository>/
└── templates/<template-repository>/
```

Repository provenance is not workflow state. Create a missing asset; assess an existing implementation when its contract needs reconstruction; otherwise start directly from the requested phase.

## Repository Boundaries

- **Witboost workspace:** contains toolkit files and asset categories.
- **Target adapter repository:** lives under `tech-adapters/`, contains the deployable service, and is the source of truth for current behavior.
- **Template repository:** may scaffold repositories and metadata, but does not own runtime provisioning.
- **Descriptor source:** defines portable desired state consumed by Witboost and the adapter.

Never implement target adapter behavior in the workspace root. Always identify the target adapter, related template, and descriptor source before proceeding.

## Contract Recovery

Once a target repository exists, inspect its routes, OpenAPI contract, descriptor models, configuration, scripts, tests, deployment manifests, and documentation, including `docs/HLD.md` when present as the architecture-level source of truth. Read `docs/decisions/DECISIONS.md` when present for point-in-time decisions. Treat implementation evidence, the HLD, and locked decisions as authoritative; report contradictions instead of silently choosing one.