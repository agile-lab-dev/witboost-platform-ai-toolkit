# Contributing to This Toolkit

This document covers how the toolkit itself is built and generated. If you
just want to *use* the toolkit to work on a tech adapter, see
[README.md](README.md) instead — nothing here is required for that.

## ⚙️ How It Works

```text
.witboost/agents/, .witboost/skills/   ← canonical source (edit these)
              │
              ▼
     .witboost/toolkit/setup.cjs       ← built CLI (npm run build)
              │
              ▼
   .github/agents/*.agent.md            (Copilot)
   .github/skills/<name>/               (Copilot, native skill discovery)
   CLAUDE.md + .claude/skills/<name>/    (Claude Code)
   GEMINI.md + .gemini/instructions/     (Gemini CLI)
   AGENTS.md                            (Codex)
```

- **Canonical agents** (`.witboost/agents/core/<name>/agent.yml` + `instructions.md`) hold the agent's metadata and behavior once.
- **Canonical skills** (`.witboost/skills/<name>/SKILL.md` + `references/` + `assets/`) hold shared domain knowledge once.
- A `HarnessGenerator` per IDE (`copilot`, `claude`, `gemini`, `codex`) turns those canonical definitions into that IDE's native format. Copilot and Claude Code auto-discover `SKILL.md` folders, so their generators copy the skill folder as-is; Gemini and Codex don't have that convention, so their generated instructions embed a "Skills" section pointing back at the canonical `SKILL.md`.

The diagram above shows the default workspace-scope output; `--scope shared` (recommended) and `--scope user` write the same files under a different root directory instead — see [Harness Generators](#harness-generators).

## 📍 Main Entry Points

- Canonical agent: `.witboost/agents/core/witboost-tech-adapter-ai-toolkit/agent.yml`, `instructions.md`
- Canonical skill: `.witboost/skills/witboost-tech-adapter-ai-toolkit/SKILL.md`
- Generated (self-hosted, tracked) Copilot agent: `.github/`

`.github/agents/` and `.github/skills/` are intentionally **kept tracked in git** in this repository so the Copilot agent works here out of the box with no build step. They are regenerated from the canonical source whenever it changes — run `make setup HARNESS=copilot` after editing `.witboost/`.

## 🧩 Harness Generators

| Harness | Shared scope (`--scope shared --shared-dir <path>`, recommended) | Workspace scope (default, self-contained) | User scope (`--scope user`, alternative) |
|---|---|---|---|
| `copilot` | `<dir>/agents/<name>.agent.md`, copies `<dir>/skills/<name>/`, writes `<dir>/.vscode/settings.json` (extra VS Code settings needed for a single adapter repo or a multi-root workspace, see [docs/copilot-wiring.md](docs/copilot-wiring.md)) | `.github/agents/<name>.agent.md`, copies `.github/skills/<name>/` | `~/.copilot/agents/<name>.agent.md`, copies `~/.copilot/skills/<name>/` |
| `claude` | `<dir>/CLAUDE.md` (merged), copies `<dir>/skills/<name>/` — auto-loaded, no setup | `CLAUDE.md`, copies `.claude/skills/<name>/` | `~/.claude/CLAUDE.md` (merged), copies `~/.claude/skills/<name>/` |
| `gemini` | `<dir>/instructions/<name>.md`, `<dir>/GEMINI.md` (merged) — auto-loaded, no setup | `.gemini/instructions/<name>.md`, `GEMINI.md` | `~/.gemini/instructions/<name>.md`, `~/.gemini/GEMINI.md` (merged) |
| `codex` | `<dir>/AGENTS.md` (merged) — needs a per-repo symlink or `CODEX_HOME` | `AGENTS.md` | `~/.codex/AGENTS.md` (merged) |

`copilot` is the default harness: `.witboost/config.yml` ships with
`harness.targets: [copilot]`, and the setup CLI falls back to `copilot` alone
when no config file is present. Generate additional harnesses with
`--harness <name>` (repeatable) or by listing more entries under
`harness.targets` in config.yml — see [Install the Toolkit Once](README.md#install-the-toolkit-once-recommended)
(recommended), [Alternative: Per-User Install](README.md#alternative-per-user-install),
[New Adapter](README.md#new-adapter), and [Attach Existing Adapter](README.md#attach-existing-adapter)
in the README.

## 🛠️ Development

```bash
npm install
npm run build     # bundles the setup CLI to .witboost/toolkit/setup.cjs
npm test          # vitest — validates canonical agent/skill definitions
npm run check     # tsc --noEmit
npm run lint       # biome check
npm run format     # biome format --write
```

Or via `make`:

```bash
make build      # npm install + npm run build
make test       # npm test
make check      # tsc --noEmit
make validate   # check + build + test + dry-run every harness generator
make setup      # regenerate harness files (all configured harnesses)
make setup HARNESS=claude   # regenerate a single harness
```

## ✅ Validation

```bash
make validate
```

This runs, in order: type-check (`tsc --noEmit`), build the setup CLI, the vitest suite (validates `agent.yml`/`SKILL.md` frontmatter and required reference docs), and a `--dry-run` of every harness generator to catch generation errors before they reach disk.
