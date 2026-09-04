# Contributing To The Witboost AI Toolkit

## Source Of Truth

- `skills/` contains directly distributable Agent Skills.
- `skills/witboost-toolkit` routes across domains.
- `skills/witboost-tech-adapter` contains the complete tech-adapter workflow.
- `skills/witboost-template` and `skills/witboost-policy` remain explicitly incomplete until their contracts are designed.
- `core/README.md` defines shared authoring semantics, not a runtime dependency.
- `src/` contains the npm workspace CLI.
- `.github/agents/` contains optional thin native wrappers only.

Every skill must be self-contained. Do not add references from a domain skill to sibling skill directories because installers may install only one skill.

## Choosing A Boundary

Add domain knowledge by entity, not by lifecycle phase. A domain skill may contain multiple phase playbooks. Create another skill only when an entity has independent ownership and can be installed meaningfully on its own.

Native agents are optional UX entry points. Their instructions should only load one skill and select a playbook; workflow rules and deliverables belong in the skill.

## Development

```bash
npm ci
npm run check
npm run lint
npm test
npm run build
npm pack --dry-run
```

Or run the complete validation:

```bash
make validate
```

## Releases

CLI and skills currently use a synchronized SemVer `0.x` release train. A release must:

1. Update `package.json` and `package-lock.json` together.
2. Keep skill boundaries and incomplete-domain status accurate.
3. Run `make validate`.
4. Build and inspect the npm package.
5. Push an immutable Git tag `vX.Y.Z` matching `package.json` version `X.Y.Z`.

Tag pipelines validate the version match and automatically publish `@witboost/ai-toolkit` to the project GitLab npm registry using `CI_JOB_TOKEN`. The same Git tag is the immutable release consumed by `npx skills`.

Breaking changes before `1.0.0` increment the minor version and require migration notes.

Architectural decisions are recorded in [`docs/decisions/DECISIONS.md`](docs/decisions/DECISIONS.md).
