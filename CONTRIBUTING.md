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

The diagram above shows contributor-only self-hosted output. Public setup always writes to the Witboost workspace passed with `--dir`.

## 📍 Main Entry Points

- Canonical agent: `.witboost/agents/core/witboost-tech-adapter-ai-toolkit/agent.yml`, `instructions.md`
- Canonical skill: `.witboost/skills/witboost-tech-adapter-ai-toolkit/SKILL.md`
- Generated (self-hosted, tracked) Copilot agent: `.github/`

`.github/agents/` and `.github/skills/` are intentionally **kept tracked in git** in this repository so the Copilot agent works here out of the box with no build step. They are regenerated from the canonical source whenever it changes — run `make setup HARNESS=copilot` after editing `.witboost/`.

## 🧩 Harness Generators

| Harness | Workspace folder | Self-hosted (`--self-host`) |
|---|---|---|
| `copilot` | `agents/`, `skills/`, `.vscode/settings.json` | `.github/agents/`, `.github/skills/` |
| `claude` | merged `CLAUDE.md`, `skills/` | `CLAUDE.md`, `.claude/skills/` |
| `gemini` | merged `GEMINI.md`, `instructions/`, `skills/` | `GEMINI.md`, `.gemini/instructions/` |
| `codex` | merged `AGENTS.md`, `skills/` | `AGENTS.md` |

`copilot` is the default harness: `.witboost/config.yml` ships with
`harness.targets: [copilot]`, and the setup CLI falls back to `copilot` alone
when no config file is present. Generate additional harnesses by repeating
`--harness <name>` or listing them under `harness.targets` in config.yml.

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
make setup      # regenerate this repository's tracked harness files
make setup HARNESS=claude   # regenerate a single harness
```

## ✅ Validation

```bash
make validate
```

This runs, in order: type-check (`tsc --noEmit`), build the setup CLI, the vitest suite (validates `agent.yml`/`SKILL.md` frontmatter and required reference docs), and a `--dry-run` of every harness generator to catch generation errors before they reach disk.
