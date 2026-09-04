# Toolkit Decision Log

## 2026-09-03 - Architecture, Distribution, And Versioning Review

- Status: open
- Scope: canonical agent and skill model, harness projections, toolkit distribution, updates, scaffold provenance, and release versioning.
- Evidence: canonical definitions under `.witboost/`, harness generators under `.witboost/toolkit/src/`, package metadata, CI configuration, setup behavior, and repository documentation.
- Open follow-ups: agree on the target architecture and release channel before implementation; define whether generated self-hosted projections remain tracked.

| Topic | Status | Leading Decision | Evidence In Repo | Open Risk |
| --- | --- | --- | --- | --- |
| Canonical workflow authority | partially locked | Keep one canonical skill as the source of workflow rules and domain knowledge. Reduce phase agents to activation metadata and playbook routing. | The skill already provides progressive disclosure, while agent instructions duplicate boundaries and deliverables. | Existing drift produces different behavior depending on the active projection. |
| Harness strategy | open | Generate native thin agents only where the harness supports their activation semantics. Generate one neutral dispatcher for fallback harnesses. | Copilot receives separate agent files; Claude, Gemini, and Codex globally load concatenated phase personas. | The same installation currently has materially different semantics across harnesses. |
| Distribution artifact | open | Publish one immutable CLI package, or initially an equivalent checksummed release archive, instead of requiring a source checkout. | Installation currently requires `npm install`, a local build, and direct execution of `.witboost/toolkit/setup.cjs`. | Consumers cannot select or reproduce an installed artifact reliably. |
| Update ownership | open | Record generated paths, hashes, harnesses, and toolkit version in an installation manifest; stage updates and refuse conflicts by default. | Setup overwrites owned agent files, replaces skill directories, and does not track stale outputs or local modifications. | Updates can destroy local changes and leave removed files behind. |
| Toolkit versioning | open | Use exact SemVer `0.x` releases and require package version, Git tag, CLI version, and installation manifest to agree. | Version `0.1.0` is duplicated and there is no tag pipeline, changelog, `--version`, or installed-version record. | A workspace cannot identify or compare the toolkit revision that generated it. |
| Scaffold provenance | open | Pin each language scaffold to a tested immutable commit and record its URL and revision in the generated repository. | `create-tech-adapter.sh` shallow-clones the mutable default branch and removes its Git history. | Two creations from the same toolkit version can produce different adapters. |
| Validation | open | Validate every canonical agent and reference, snapshot each harness projection, and test install and update behavior. | Tests cover the umbrella agent and documentation shape; setup is excluded from coverage and CI does not check generated-file parity. | Generator regressions and canonical/generated drift can reach consumers undetected. |

## 2026-09-03 - Adopt Domain-Oriented Skills And Separate Workspace CLI

- Status: partially locked
- Scope: long-term toolkit structure for tech adapters, templates, policies, and future Witboost asset types.
- Evidence: architecture review above and the lack of equivalent multi-agent semantics across supported harnesses.
- Open follow-ups: design the template and policy domain contracts before making those skills discoverable; define registry publication credentials and release automation.

| Topic | Status | Decision | Compatibility Effect | Open Risk |
| --- | --- | --- | --- | --- |
| Skill boundary | locked | Use one self-contained skill per entity and one lightweight cross-domain router. Lifecycle phases remain internal playbooks. | Replaces the previous phase-agent model. | New domains need an explicit ownership contract before activation. |
| Tech adapter pack | locked | Rename the complete canonical pack to `witboost-tech-adapter`. | Existing installations of `witboost-tech-adapter-ai-toolkit` must reinstall the new skill. | Migration is manual during the `0.x` prototype. |
| Template and policy packs | partially locked | Reserve self-contained internal skill structures but do not invent playbooks or implementation rules. | No production workflow is exposed yet. | Their real lifecycle may require refining the shared vocabulary. |
| Runtime integration | locked | Delegate skill placement and updates to `npx skills`; retain only thin optional native wrappers. | Retires generated Claude, Gemini, Codex, and copied skill projections. | Private repository authentication must be documented for consumers. |
| Workspace tooling | locked | Publish a separate npm CLI for workspace setup, diagnostics, manifest management, and reproducible asset creation. | Retires `setup --harness`; workspace setup no longer installs prompts. | Registry coordinates and release pipeline remain to be configured. |
| Versioning | partially locked | Use synchronized SemVer `0.x` releases for CLI and domain packs, plus an independent manifest schema version. | Version `0.2.0` introduces the new boundaries. | Independent pack versioning may be needed after domains mature. |
| Scaffold provenance | locked | Pin scaffold commits in a versioned catalog and record provenance in each created repository. | New repositories contain `docs/scaffold-provenance.json`. | Pinned revisions require an explicit update process. |
