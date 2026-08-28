# Witboost Tech Adapter AI Toolkit

Dedicated toolkit for designing, reviewing, implementing, and testing Witboost tech adapters end to end.

This repository is a sibling of [witboost-ai-toolkit](https://github.com/agile-lab-dev/witboost-ai-toolkit) and follows the same architecture: a **canonical source of truth** (agent + skill definitions) that a **setup CLI** compiles into IDE-native files for Copilot, Claude Code, Gemini CLI, and Codex.

This repository is meant to be used in two modes:

1. `new adapter`
   Start a new tech adapter from scratch.
2. `attach existing adapter`
   Use this repository's workflow against an existing tech adapter repository.

## 📐 Recommended Layout

A Witboost installation is rarely just one tech adapter — teams typically end
up with several (Kafka, S3, dbt, Databricks, ...) developed side by side. The
recommended layout keeps every adapter as its own independent git repository
under one common parent folder, with the toolkit's agents and skills
installed **once** into that parent instead of copied into every repo:

```text
~/witboost/tech-adapters/            ← shared install lives here (--shared-dir)
├── CLAUDE.md, GEMINI.md, AGENTS.md    (generated once, merged if you add your own content)
├── agents/, skills/, instructions/    (generated once)
├── witboost-kafka-tech-adapter/       ← independent git repo
├── witboost-s3-tech-adapter/          ← independent git repo
└── witboost-dbt-tech-adapter/         ← independent git repo
```

If your adapters don't share a common parent folder, or you want coverage
across every repo on the machine regardless of where it lives, see
[Alternative: Per-User Install](#alternative-per-user-install) instead.

## 🚀 Usage

A tech adapter is a real deployable microservice — it never lives in this
dedicated agent repository, in either mode. Both modes end up operating
against a separate target repository; `new adapter` just adds a bootstrap
step before that.

### 🗂️ Install the Toolkit Once (Recommended)

Before creating or attaching any individual adapter, install the toolkit's
agents and skills once into the shared parent folder from
[Recommended Layout](#recommended-layout):

```bash
# from this repo, after npm run build
node .witboost/toolkit/setup.cjs --harness copilot --scope shared --shared-dir ~/witboost/tech-adapters
# or: make install-shared HARNESS=claude SHARED_DIR=~/witboost/tech-adapters
```

This writes `CLAUDE.md` / `GEMINI.md` / `AGENTS.md` plus per-agent files and
skills directly into that folder. What happens next depends on the harness:

- **Claude Code** and **Gemini CLI** pick it up automatically for every
  adapter repo nested under it — nothing else to do.
- **Copilot** doesn't auto-discover an arbitrary shared folder for
  independent sibling repos — wire it yourself via
  `chat.agentFilesLocations` / `chat.agentSkillsLocations` (each is a map of
  folder path → enabled). This only matters for a repo relying on the shared
  install instead of local generation — see
  [Attach Existing Adapter](#attach-existing-adapter) for when that applies;
  a repo produced by [New Adapter](#new-adapter) already has its own
  `.github/agents` and needs none of this. If you open all your adapters
  together in a multi-root workspace, add both keys to its
  `.code-workspace` file's `settings` block:

  ```jsonc
  {
    "folders": [
      { "path": "witboost-kafka-tech-adapter" },
      { "path": "witboost-s3-tech-adapter" }
    ],
    "settings": {
      "chat.agentFilesLocations": { "~/witboost/tech-adapters/agents": true },
      "chat.agentSkillsLocations": { "~/witboost/tech-adapters/skills": true }
    }
  }
  ```

  Opening one such adapter repo at a time instead? Add the same two keys to
  that repo's own `.vscode/settings.json` (a one-line pointer, not a content
  copy) — use a relative path if the repo sits directly under the shared
  folder, e.g. `"../agents"` / `"../skills"`.

  Always open the shared parent folder itself as your workspace (with every
  adapter nested inside it, as in [Recommended Layout](#recommended-layout))?
  Skip per-workspace config entirely and set both keys **once**, in your own
  VS Code User settings (not a workspace/repo file), using bare relative
  names:

  ```jsonc
  "chat.agentFilesLocations": { "agents": true },
  "chat.agentSkillsLocations": { "skills": true }
  ```

  These resolve relative to whichever folder is currently open as the
  workspace root, so this one-time personal setting picks up the shared
  `agents/`/`skills/` folders automatically for every future shared-scope
  install, with nothing to add per teammate, per repo, or per `.code-workspace`
  file. It only helps when the shared folder itself is the open workspace
  root — opening a single adapter repo on its own still needs one of the two
  options above.
- **Codex** only reads `AGENTS.md` from inside its own git project root,
  never a parent folder. Either symlink it per repo
  (`ln -s ~/witboost/tech-adapters/AGENTS.md <adapter-repo>/AGENTS.md`) or
  set `CODEX_HOME=~/witboost/tech-adapters` for sessions launched from there.

The command prints the relevant follow-up for each harness after it runs.
Root instructions files are **merged**, not overwritten — the toolkit's
content is upserted into a marked block, so the rest of the file (e.g. other
team notes) is left untouched; re-running the command later just updates
that block.

Repeat with `--harness copilot`, `--harness gemini`, `--harness codex` (or
list them all under `harness.targets` in `.witboost/config.yml`) to cover
every IDE your team uses. Once this is done, [New Adapter](#new-adapter) and
[Attach Existing Adapter](#attach-existing-adapter) below only need to worry
about the adapter repo itself, not about (re)installing agents/skills.

### 🆕 New Adapter

Start from one of the two official Witboost scaffolds, matching the language
the user wants:

| Language | Scaffold |
|---|---|
| Java | [witboost-java-scaffold](https://github.com/agile-lab-dev/witboost-java-scaffold) |
| Python | [witboost-python-scaffold](https://github.com/agile-lab-dev/witboost-python-scaffold) |

The target path must be a new, empty (or not-yet-existing) directory outside
this toolkit repository — it becomes the tech adapter's own independent git
repository, never a folder inside this one.

Bootstrap it with the helper script (requires `npm run build` / `make build`
to have run in this repo first, so `.witboost/toolkit/setup.cjs` exists):

```bash
scripts/bootstrap-new-adapter.sh <java|python> /path/to/new-tech-adapter-repo <harness...>
```

This clones the scaffold straight into the target path, strips exactly that
clone's git history, initializes independent history, copies this
repository's `.witboost/` into the target, runs the setup CLI there for
every harness passed, and then automatically runs `check-bootstrap.sh` in
the target repo to verify scaffold structure and harness files.

Now you can open the path in your IDE and start working on the tech adapter leveraging the injected agents. Jump to [What To Do Next](#what-to-do-next) to pick the next phase.

### 🔗 Attach Existing Adapter

If the target repo already lives inside the shared parent folder from
[Install the Toolkit Once](#install-the-toolkit-once-recommended) and the
harness you use is wired up (Claude Code/Gemini CLI: automatic; Copilot: one
of the `chat.agentFilesLocations` / `chat.agentSkillsLocations` options
above; Codex: the symlink or `CODEX_HOME`), there's nothing to install here
— the agent definitions and the skill's playbooks/topics already exist in
the shared folder, the same way they would if this repo had its own copy.
Just open the target repo (or the shared parent folder itself) and invoke
the workflow directly, skipping straight to the prompt below.

Only copy the canonical `.witboost/` folder and run the setup CLI **inside
the target repo** if you want this specific adapter to be self-contained
even without the shared install present — e.g. it may get cloned standalone,
or handed to someone who hasn't set up the shared/user install:

```bash
# from this repo, after npm run build
cp -r .witboost/ /path/to/target-tech-adapter-repo/

# inside the target repo
node .witboost/toolkit/setup.cjs --harness copilot
# or: --harness claude / --harness gemini / --harness codex
# repeat --harness to generate multiple, or omit it to use .witboost/config.yml defaults
```

This generates the agent/skill files native to your IDE directly in the target adapter repository, without needing to open this repo as a second workspace.

Either way, invoke the workflow in the target repo with a prompt like:

> Attach to the existing tech adapter in this repo. Mode: attach existing adapter.


Expected first outputs:

- target repo inventory
- reconstructed lifecycle map
- actual versus expected contract gaps
- required test coverage deltas

Continue to [What To Do Next](#what-to-do-next) to pick the next phase.

### 🌐 Alternative: Per-User Install

If your adapters don't live under one common parent folder — or you want
coverage across every repo on the machine, not just the ones under a
specific directory — install into the harness's own home-directory config
instead of a shared folder:

```bash
# from this repo, after npm run build
node .witboost/toolkit/setup.cjs --harness claude --scope user
# or: make install-user HARNESS=claude
```

This writes to `~/.copilot/`, `~/.claude/`, `~/.gemini/`, `~/.codex/` instead
of a specific folder, so the agents and skills are available in *every* repo
you open with that harness. Root instructions files are merged the same way
as the shared install above. The trade-off versus the shared, recommended
approach: it also reaches repos that have nothing to do with Witboost, and
there's no single directory you can point a teammate at to reproduce the
same setup.

Per-repo generation (workspace scope, the default used by
[New Adapter](#new-adapter) and [Attach Existing Adapter](#attach-existing-adapter))
remains available too, and is still the only fully self-contained option — a
repo generated that way works even if cloned on its own, with nothing to
install first.

## 🧭 What To Do Next

Once a target repository has been bootstrapped or attached, the workflow
stays in that repo's own session. `attach existing adapter` is only the
first step — it reconstructs the actual contract so every following phase is
grounded in real evidence instead of assumptions. Pick the phase that matches
what you actually want to do next:

| You want to... | Say something like | Playbook |
|---|---|---|
| Establish or extend the adapter's architecture-level scope (recommended before a first or newly scoped feature) | `Let's define the high-level design for this adapter.` | [high-level-design](.witboost/skills/witboost-tech-adapter-ai-toolkit/references/playbooks/high-level-design.md) |
| Define a new feature | `Define support for <feature> in this adapter.` | [new-feature](.witboost/skills/witboost-tech-adapter-ai-toolkit/references/playbooks/new-feature.md) |
| Review an existing feature or recent change | `Review the <feature/area> implementation.` | [review](.witboost/skills/witboost-tech-adapter-ai-toolkit/references/playbooks/review.md) |
| Implement an already-designed change | `Implement the locked decision for <feature>.` | [implement](.witboost/skills/witboost-tech-adapter-ai-toolkit/references/playbooks/implement.md) |
| Test a change locally | `Test <lifecycle action> against the local adapter.` | [test](.witboost/skills/witboost-tech-adapter-ai-toolkit/references/playbooks/test.md) |

Each phase reads `docs/decisions/DECISIONS.md` (when it exists) before acting
and records newly locked decisions there, so decisions made during New Feature are
available to Implement and Test even across separate sessions. High-Level Design is
recommended, skippable, and only needed the first time or when the request
touches scope `docs/HLD.md` does not cover yet. New Feature and Review typically
come first for anything non-trivial; jump straight to Implement only for
changes small enough that the design is obvious and uncontested.

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
| `copilot` | `<dir>/agents/<name>.agent.md`, copies `<dir>/skills/<name>/` (needs manual VS Code settings, see above) | `.github/agents/<name>.agent.md`, copies `.github/skills/<name>/` | `~/.copilot/agents/<name>.agent.md`, copies `~/.copilot/skills/<name>/` |
| `claude` | `<dir>/CLAUDE.md` (merged), copies `<dir>/skills/<name>/` — auto-loaded, no setup | `CLAUDE.md`, copies `.claude/skills/<name>/` | `~/.claude/CLAUDE.md` (merged), copies `~/.claude/skills/<name>/` |
| `gemini` | `<dir>/instructions/<name>.md`, `<dir>/GEMINI.md` (merged) — auto-loaded, no setup | `.gemini/instructions/<name>.md`, `GEMINI.md` | `~/.gemini/instructions/<name>.md`, `~/.gemini/GEMINI.md` (merged) |
| `codex` | `<dir>/AGENTS.md` (merged) — needs a per-repo symlink or `CODEX_HOME` | `AGENTS.md` | `~/.codex/AGENTS.md` (merged) |

`copilot` is the default harness: `.witboost/config.yml` ships with
`harness.targets: [copilot]`, and the setup CLI falls back to `copilot` alone
when no config file is present. Generate additional harnesses with
`--harness <name>` (repeatable) or by listing more entries under
`harness.targets` in config.yml — see [Install the Toolkit Once](#install-the-toolkit-once-recommended)
(recommended), [Alternative: Per-User Install](#alternative-per-user-install),
[New Adapter](#new-adapter), and [Attach Existing Adapter](#attach-existing-adapter).

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

## 📝 Notes

- This toolkit is intentionally lightweight: no MCP server, no platform API client, no auth/token handling — it only reads canonical markdown/YAML and writes IDE-native files.
- It does not assume a specific cloud provider implementation.
- Foundations and playbooks are provider-neutral. Adapter-specific behavior must be recovered from the target repository; topic files provide the reusable design, review, and test rules.
