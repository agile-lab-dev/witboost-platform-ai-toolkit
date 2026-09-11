# Witboost AI Toolkit

Domain-oriented Agent Skills and workspace tooling for the lifecycle of Witboost assets.

The toolkit is designed to grow across independently versioned entity types without multiplying one agent per lifecycle phase.

## Architecture

```text
skills/
├── witboost-toolkit/       # cross-domain router
├── witboost-tech-adapter/  # complete domain pack
├── witboost-template/      # complete domain pack
└── witboost-policy/        # reserved, intentionally incomplete

core/                       # shared authoring contract
src/                        # workspace CLI, not AI instructions
```

The common lifecycle vocabulary is `create`, `assess`, `design`, `evolve`, `review`, `implement`, and `validate`. Each domain skill defines what those phases mean for its entity.

## Install Skills

Use the open Agent Skills installer. It maps the canonical skills to the native location of each supported coding agent.

Create the workspace directory and change into it. Keep this as the current directory for both skill installation and workspace setup:

```bash
mkdir -p ~/witboost-workspace
cd ~/witboost-workspace

npx skills add \
  "https://gitlab.com/AgileFactory/Witboost.Mesh/ai/witboost-tech-adapter-ai-toolkit.git#v0.2.7" \
  --skill witboost-toolkit \
  --skill witboost-tech-adapter \
  --skill witboost-template
```

When prompted for the installation scope, select **Project**. This creates `skills-lock.json` in the current workspace and makes the setup reproducible. Use **Global** only for personal skills that should be available across all your workspaces.

Once installation is complete your skills will be available to your coding agent. As an example, in VS Code you can use them by typing `/witboost-<name of the skill>` in the Copilot chat input box.

## Configure A Workspace

The separate npm CLI owns only workspace structure, version metadata, diagnostics, and reproducible scaffolding. It is published to this project GitLab npm registry by the matching release tag.

Configure the token issued by Witboost before installing the private package:

```bash
export WITBOOST_NPM_TOKEN=<token-issued-by-witboost>
npm config set @witboost:registry \
  "https://gitlab.com/api/v4/projects/85577854/packages/npm/"
npm config set -- \
  "//gitlab.com/api/v4/projects/85577854/packages/npm/:_authToken" \
  "$WITBOOST_NPM_TOKEN"
```

From the same `~/witboost-workspace` directory, use the exact version matching the skill tag:

```bash
npx @witboost/ai-toolkit@0.2.7 setup --dir .
npx @witboost/ai-toolkit@0.2.7 doctor --dir .
```

`setup` refuses a workspace directory without the required project skill lock or with skill refs that do not match the CLI release. `doctor` verifies the same alignment again.

It creates:

```text
~/witboost-workspace/
├── .agents/skills/             # location varies by selected coding agent
├── .witboost-toolkit/manifest.json
├── skills-lock.json
├── tech-adapters/
├── templates/
└── policies/
```

The workspace is an organizational root. Implementations and decisions remain in independently versioned asset repositories.

## Create A Tech Adapter

```bash
npx @witboost/ai-toolkit@0.2.7 create tech-adapter java my-adapter --dir .
```

The CLI fetches the exact scaffold commit recorded in `config/scaffolds.json`, verifies its structure, writes `docs/scaffold-provenance.json`, and starts independent Git history.

Template and policy creation commands will be added only after their lifecycle contracts are designed.

## Optional Native Agents

`.github/agents/` contains three thin Copilot wrappers: one cross-domain router, one tech-adapter entry point, and one template entry point. They require the corresponding skills to be installed for Copilot first. Other runtimes should use their installed skills directly. Lifecycle-phase personas are intentionally not generated.

## Versioning

During prototyping, CLI and skill packs follow one synchronized `0.x` release train. Tag `vX.Y.Z` must exactly match `package.json` version `X.Y.Z`; a valid tag publishes the npm package automatically after all pipeline jobs pass.

- patch: compatible corrections;
- minor: new behavior and documented breaking changes;
- `1.0.0`: stable CLI, manifest schema, skill boundaries, and migration policy.

The workspace manifest records the CLI release and has an independent schema version.

## Development

```bash
npm ci
make validate
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for source-of-truth and validation rules.
