# Tech Adapter Repository Contract

## Target Repository

The target tech adapter is an independently versioned repository that owns the deployable adapter service and is the source of truth for its current behavior. It may be opened directly as the current Git repository or located under `tech-adapters/<repository>/` in a configured Witboost workspace.

Resolve context in this order:

1. Use the current Git repository when it contains converging Tech Adapter evidence, such as the installed-version Tech Adapter OpenAPI, lifecycle routes, request/status models, or explicit adapter documentation.
2. Otherwise, if the current directory is a configured Witboost workspace, locate the requested repository under `tech-adapters/`.
3. Otherwise, ask for an explicit target path.

Do not classify a repository from its directory name alone. If evidence is ambiguous, ask before acting. Never implement adapter behavior in the workspace root. A workspace is required only for Create, multi-repository discovery, or cross-entity work. Repository provenance is not workflow state: create a missing repository, assess an undocumented contract, otherwise start directly from the requested lifecycle phase.

## Ownership Boundaries

| Owner | Responsibility | Boundary With The Tech Adapter |
| --- | --- | --- |
| Tech adapter repository | Validation, provider reconciliation, identity and secret wiring, lifecycle status, and observed provisioning information | Owns provider-specific runtime behavior and returns provider observations/results; it does not redefine portable desired state |
| Descriptor source | Portable desired state and deployment input metadata | Supplies intent to the adapter; it does not own provider observations, operator credentials, or adapter internals |
| Template repository | Repository scaffolding, initial metadata, and generated files. When a workload template generates an artifact pipeline, it also owns that CI/CD contract for building, testing, packaging, and publishing from the scaffolded repository. Other workloads and component kinds may have no artifact-build pipeline. | Owns the development and any release process it generates for the component; it does not own provider-specific runtime reconciliation |
| Witboost Builder | Lifecycle orchestration, request submission, and status surfacing | Must not implement provider-specific behavior |

Identify the target adapter, descriptor source, and related template before changing behavior. When a workload template generates artifact CI/CD, also inspect the scaffolded repository and pipeline because they implement the template's artifact contract. Do not model that generated pipeline as an independent domain owner, and do not assume every workload or non-workload component has one.

## Contract Recovery

When behavior is not documented well enough for the requested work, inspect the target repository's:

- routes and OpenAPI contract;
- request, descriptor, and response models;
- lifecycle handlers and provider clients;
- configuration and secret-resolution paths;
- tests and validation scripts;
- deployment manifests;
- `docs/HLD.md` and `docs/decisions/DECISIONS.md` when present.

Prefer executable behavior and public contracts over examples. Treat tests, locked decisions, and the HLD as supporting authoritative evidence. Report contradictions and compatibility risks instead of silently selecting one source.
