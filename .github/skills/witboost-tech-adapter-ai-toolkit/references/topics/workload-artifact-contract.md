# Workload Artifact Contract

## Concept

Workload components commonly contain ingestion or processing business logic that must be packaged or otherwise frozen before deployment. Treat the complete path from source to running workload as one release contract:

1. A component-owned CI/CD pipeline builds and tests the business logic.
2. The pipeline publishes an immutable workload release to an artifact repository or marks an immutable source revision as released.
3. Witboost release metadata or an explicit descriptor field provides the release selector.
4. The tech adapter resolves that selector to an immutable release identity, verifies it, stages it when required, and configures the target platform to execute it.
5. Status and unprovision use the resolved release identity or persisted platform identifiers rather than re-resolving mutable inputs.

Keep the workload release separate from the tech adapter's own JAR, wheel, container image, and Helm chart. The adapter CI/CD publishes the adapter; it must not be mistaken for the pipeline that publishes Data Product business logic.

The workload release can take different forms:

| Delivery mode | What is delivered | Example | Required release identity |
|---|---|---|---|
| Published package or bundle | One executable file or an archive containing the entrypoint and its dependencies. The adapter retrieves and may stage it before deployment. | CI/CD publishes a versioned Python script for **AWS Glue**, a DAG bundle for **Airflow**, or a JAR/ZIP for **Dataproc** or **Databricks**; the adapter verifies and deploys that package. | Repository, package name, and exact version as selector; digest as immutable identity. For object storage, use bucket/key plus object version or checksum. |
| Git release | A source tree containing scripts, notebooks, transformations, or deployment manifests that the target platform reads directly. | A **Databricks Job** selects release tag `v1.4.2`, whose repository policy forbids moving or deleting it, and records resolved commit `8f3c2ab`; an **Argo CD Application** may use the commit directly. | Repository plus release tag or commit selector, with the resolved commit retained as the immutable identity; a branch, `HEAD`, or movable tag is not a production release identity |
| External control-plane deployment | A package or Git release already linked to project, environment, job, or similar objects in a managed service. | For **dbt Cloud**, the adapter configures the project environment and job with an immutable Git revision and then triggers execution; dbt Cloud checks out and runs the code. | Underlying immutable package or source identity plus the platform object identifiers and runtime version needed to reproduce the deployment |

A release may contain multiple files. Those files form one atomic artifact set: missing, ambiguous, corrupt, or mismatched members are a failure to resolve the release, not a best-effort deploy.

## Design Decision

### Responsibility Model

| Concern | Default owner |
|---|---|
| Business source, build, tests, package manifest, provenance, and publication | Workload component repository and its CI/CD pipeline |
| Release selector exposed to Witboost | Witboost release metadata or an explicit descriptor artifact coordinate |
| Registry endpoint, credentials, target account, and installation-specific staging location | Tech adapter configuration and secret management |
| Exact resolution, integrity and completeness checks, staging, and target-platform deployment | Tech adapter |
| Immutability, retention, duplicate-version rejection, and digest availability | Artifact repository policy, verified by CI/CD and adapter |

The template may scaffold the workload repository and its pipeline, but it does not build artifacts at provisioning time. The descriptor expresses which already-published release to deploy. The tech adapter is a consumer and deployer, not the authority that compiles or packages business logic.

### Release Authority

- Choose exactly one authoritative workload release selector. Prefer Witboost release metadata when it unambiguously selects the complete workload release; otherwise define an explicit structured artifact coordinate in the workload `specific` section. Resolve the selector to one immutable identity.
- Do not assume `dataProduct.version`, component `version`, or Data Product major version identifies the workload artifact unless the publishing contract explicitly maps it to that artifact. Data Product major remains the default infrastructure identity driver; workload release identity is a separate concern and can change while infrastructure is reused.
- Resolve packages by repository, package name, and exact version, then verify and retain a digest or object version. A Git release may use a tag as its human-readable selector only when repository policy forbids moving or deleting released tags; resolve and retain the corresponding commit SHA.
- Production must reject mutable selectors such as `latest`, `HEAD`, branches, unversioned object keys, and movable tags unless the use case explicitly chooses continuous tracking and accepts non-reproducible deployment.
- A human-readable semantic version is useful for release selection; a content digest or commit SHA proves the exact bytes. When both exist, retain both.

### Artifact-Set Contract

- Define a manifest for every required member and its role: entrypoint, libraries, configuration, DAG sidecar, notebooks, manifests, or other runtime dependencies.
- Resolve and verify the whole set before mutating the current deployment. Reject zero files, duplicate candidates, unexpected ambiguous matches, missing members, checksum failures, and descriptor references absent from the package.
- Do not select the first file returned by a registry unless the publication contract guarantees exactly one file and the adapter validates that cardinality.
- Prefer staging under a versioned or digest-addressed path, then switch the workload definition to the completed release. Deleting or overwriting the active prefix before all uploads succeed creates a partial deployment.
- Define rollback and retry behavior for every boundary: download, verification, extraction, staging, platform resource update, and cleanup.

### Lifecycle Rules

- `validate` verifies descriptor shape, selector syntax, and cross-field rules without accessing the artifact repository or mutating state. `provision` performs remote resolution and all existence, integrity, and completeness checks so it never relies on an earlier time-of-check result.
- `provision` resolves the selector to one immutable release identity, verifies integrity and completeness, stages atomically when needed, updates the workload, and persists enough evidence to identify what was deployed.
- `status` should report the desired release selector and observed release identity where the platform exposes them. A successful API submission is not proof that the requested revision is running.
- `unprovision` uses persisted deployment/platform identifiers. State explicitly whether staged workload artifacts are deleted, retained for rollback, or governed by repository retention.

### Existing Adapter Scan

For every workload component, answer all of these questions with code, descriptor, pipeline, test, or platform evidence:

1. What business logic runs, and what files or source tree form its complete release?
2. Which component repository and CI/CD pipeline build, test, package, and publish it?
3. Is the adapter's own delivery pipeline clearly separated from workload artifact generation?
4. What event creates a workload release, and can publication occur before the artifact set is complete?
5. Where is the underlying release published: package registry, container registry, object storage, or Git? Does an external control plane mediate its deployment?
6. Which field is the authoritative release selector, and how does it relate to Witboost release metadata, Data Product version, and component version?
7. What exact coordinates reach the descriptor, and which installation-specific coordinates remain adapter configuration?
8. Which immutability guarantees back each selector? Can versions, tags, or object keys be overwritten or duplicated?
9. Is a digest, object version, or commit SHA available, verified, and persisted?
10. Does one release contain one file or a manifest of multiple required artifacts?
11. How does the adapter reject zero, duplicate, missing, unexpected, corrupt, or mismatched artifact members?
12. Does `validate` remain local and side-effect free, with remote resolution performed during `provision`?
13. Does staging use a release-specific location, or overwrite a stable active path?
14. Can the current deployment remain intact until the new release is completely staged and verified?
15. What happens when staging succeeds but target-platform creation or update fails?
16. Which desired selector and observed immutable identity are returned by `provision` and `status`?
17. Can retry, rollback, status, and unprovision operate without re-resolving a mutable descriptor input?
18. Who owns retention and deletion of source packages, staging copies, and superseded releases?
19. For an external control-plane deployment, does `unprovision` delete an object (project, job, application) that an operator had separately configured? Does re-`provision` recreate an object equivalent to a first-time deployment, or one missing that operator-configured state (see [Re-Provisioning Parity](./re-provisioning-parity.md))?

## Review Signals

- High: no identifiable workload-producing CI/CD, or the tech adapter builds business logic during provisioning.
- High: branch, `HEAD`, `latest`, movable tag, or unversioned object key controls a production deployment without an observed immutable revision.
- High: requested release and deployed bytes can differ silently, including ignored descriptor revision fields.
- High: the adapter selects the first registry file, accepts an incomplete multi-artifact set, or deletes the active release before verifying the replacement.
- High: a package version can be overwritten or duplicated without digest verification.
- Medium: staging succeeds before platform deployment fails and there is no reconciliation or cleanup strategy.
- Medium: status reports operation success but not the release actually running.
- Medium: unprovision re-downloads or re-resolves mutable source instead of using persisted deployment evidence.
- Medium: workload registry endpoints, credentials, or installation-specific buckets are embedded in portable descriptor intent without justification.
- Medium: adapter artifact CI/CD is documented while workload artifact generation and publication remain unspecified.
- Medium: `unprovision` deletes an external control-plane object that carried operator-configured settings the adapter does not manage, so re-`provision` silently recreates a divergent object instead of an equivalent first-time deployment.

## Test Coverage

- Assert the exact selector and resolved digest, object version, or commit passed to the target platform.
- Assert that mutable selectors are rejected in production policy, or explicitly test the documented continuous-tracking behavior.
- Assert zero-match, duplicate-match, missing-member, unexpected-member, corrupt-archive, checksum-mismatch, and descriptor-to-manifest mismatch failures.
- Assert that all required artifacts are verified before the active release is deleted, overwritten, or switched.
- Assert retry behavior after failure at each stage and prove that no mixed-version artifact set can become active.
- Assert rollback or reconciliation when staging succeeds but workload creation, update, sync, or health verification fails.
- Assert that status distinguishes the desired release selector from the observed digest, commit, or platform revision.
- Assert retention and cleanup behavior for successful replacement, failed provisioning, rollback, and unprovision.
- Include contract tests against the publishing pipeline's manifest and naming rules so CI/CD output and adapter resolution cannot drift independently.
