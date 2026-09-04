# Workspace Model

The configured workspace groups independently versioned Witboost assets without becoming their source repository:

```text
witboost-workspace/
├── tech-adapters/<repository>/
├── templates/<repository>/
├── policies/<repository>/
└── .witboost-toolkit/manifest.json
```

The workspace owns discovery and shared tooling. Each entity repository owns its implementation, tests, architecture documentation, and decision history.

Before reading or changing behavior:

1. Identify the entity type.
2. Identify the target repository.
3. Identify related repositories and their ownership boundaries.
4. Select the domain pack and lifecycle phase.

Repository provenance is not workflow state. A repository may be new but already designed, or existing but undocumented.
