# Workload Artifact Producer Contract

## Scope

This contract applies only when a workload template generates a component repository and CI/CD process that builds or releases executable business logic. Non-workload component templates typically do not have an artifact producer contract.

The workload template owns this generated development and release process. The generated CI/CD executes it in the scaffolded workload repository; it is not a separate domain owner.

## Upstream Interface Checklist

For Tech Adapter work, reconstruct and verify that the workload template defines:

1. Business source structure and build entrypoints.
2. Tests and quality gates executed before publication.
3. Package or released-source format, required members, and entrypoint metadata.
4. Versioning and selector scheme exposed to the descriptor or Witboost release metadata.
5. Publication destination and duplicate-version behavior.
6. Digest generation when the publication mechanism supports it.
7. Atomic publication semantics so a release cannot be observed partially.
8. Retention and immutability policy for released versions.

The output may be a package/archive, an immutable Git revision, or metadata consumed by a provider-managed build. The producer contract describes the complete releasable unit, not only its main file.

## Upstream Decisions To Verify

For each workload integration, identify the template's accepted decisions:

1. Which event creates a release and which generated pipeline job owns it.
2. Whether the release is pre-built or represented by source for a reproducible provider-managed build.
3. Which selector is written into the descriptor or Witboost release metadata.
4. Whether that selector is immutable or mutable and what this means for reproducibility.
5. Which digest or immutable source identity is published and how consumers obtain it.
6. Which members are required, optional, forbidden, or extension points.
7. How incomplete, duplicate, or failed publication is prevented or identified.
8. Which template and pipeline changes are compatibility changes for existing adapters.

The Tech Adapter skill uses this as an upstream compatibility and evidence checklist. If the producer contract must change, route that work to the template domain skill or an explicit cross-entity workflow; do not silently modify template-owned behavior as part of adapter-only work.

## Recommendations To The Upstream Contract

- Publish one version only after all required members and metadata are available.
- Reject replacement of an already published immutable version.
- Publish a digest when supported by the registry or object store.
- Keep workload artifacts separate from the Tech Adapter's own service image, JAR, wheel, or deployment chart.
- Make producer output contract-testable from the adapter repository without executing a real publication.

## Adapter Review Signals

- A workload template generates business logic but no release process the adapter can consume.
- Publication can expose partial or mixed-version artifact sets.
- The selector in the generated descriptor does not map unambiguously to producer output.
- Required members, entrypoint, runtime version, or package metadata are implicit.
- Released versions can be overwritten despite being documented as immutable.
- Digest or immutable source identity is available but omitted from publication metadata.
- Adapter documentation describes artifact generation that the workload template does not implement.

## Contract Evidence

- Confirm the generated workload repository contains the expected build, test, package, and publication jobs.
- Successful publication exposes all required members atomically.
- Missing, duplicate, or failed members do not produce a usable release.
- Duplicate immutable versions are rejected.
- Selector, version, digest, and source identity match the generated descriptor/release metadata.
- Provider-managed build input points to the exact source identity defined by the producer contract.
- A producer contract fixture remains compatible with the adapter consumer contract.
