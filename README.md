# Witboost Tech Adapter AI Toolkit

Toolkit for creating, assessing, designing, reviewing, implementing, and testing Witboost tech adapters.

Configure it once in a Witboost workspace folder. The folder contains generated agents and skills plus independently versioned template and tech adapter repositories.

## Quickstart

```bash
npm install
npm run build
node .witboost/toolkit/setup.cjs \
  --dir ~/witboost-workspace \
  --harness copilot
```

Repeat `--harness` to install more integrations: `copilot`, `claude`, `gemini`, or `codex`.

The command creates this layout without overwriting unrelated workspace instructions:

```text
~/witboost-workspace/
├── agents/ and skills/       # generated toolkit files
├── scripts/                  # workspace utilities
├── tech-adapters/            # independent adapter repositories
└── templates/                # independent template repositories
```

Open `~/witboost-workspace` in your IDE. Copilot is configured automatically for this case; see [Copilot wiring](docs/copilot-wiring.md) only when opening an individual repository or a multi-root workspace. Claude Code and Gemini CLI discover the workspace instructions automatically. Codex requires `CODEX_HOME=~/witboost-workspace` or a per-repository `AGENTS.md` symlink.

Re-run the same setup command after updating the toolkit. Generated files and managed instruction blocks are refreshed in place.

## Create A Tech Adapter

Use the **Witboost Adapter Create** agent, or run:

```bash
~/witboost-workspace/scripts/create-tech-adapter.sh \
  <java|python> \
  ~/witboost-workspace \
  <adapter-name>
```

The utility clones the official scaffold into `tech-adapters/<adapter-name>`, removes the scaffold history, and starts independent Git history. An untouched scaffold can proceed directly to High-Level Design or New Feature.

## Existing Tech Adapters

Place each existing repository under `tech-adapters/`. Use **Witboost Adapter Assess** only when its lifecycle and ownership contract need reconstruction; otherwise start directly from High-Level Design, New Feature, Review, Implement, or Test.

Create and Assess are operations based on current repository state. They are not permanent `new` or `attach` modes.

## Workflow

| Goal | Agent |
|---|---|
| Create a repository from an official scaffold | Witboost Adapter Create |
| Reconstruct an existing implementation contract | Witboost Adapter Assess |
| Establish architecture-level scope | Witboost Adapter High-Level Design |
| Define or customize behavior | Witboost Adapter New Feature |
| Find implementation and design risks | Witboost Adapter Review |
| Apply a locked decision | Witboost Adapter Implement |
| Exercise a running adapter locally | Witboost Adapter Test |

Decisions are persisted in each adapter's `docs/decisions/DECISIONS.md`. Adapter code remains inside its own repository; the workspace root only owns toolkit configuration and asset organization.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for canonical sources, self-hosted generation, and validation.
