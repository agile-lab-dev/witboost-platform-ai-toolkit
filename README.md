# Witboost Tech Adapter AI Toolkit

Dedicated toolkit for designing, reviewing, implementing, and testing Witboost tech adapters end to end.

This repository is a sibling of [witboost-ai-toolkit](https://github.com/agile-lab-dev/witboost-ai-toolkit) and follows the same architecture: a **canonical source of truth** (agent + skill definitions) that a **setup CLI** compiles into IDE-native files for Copilot, Claude Code, Gemini CLI, and Codex.

This repository is meant to be used in two modes:

1. `new adapter`
   Start a new tech adapter from scratch.
2. `attach existing adapter`
   Use this repository's workflow against an existing tech adapter repository.

## ⚡ Quickstart

1. **Install the toolkit once**, into the shared parent folder that will hold all your adapters (pick the harness(es) you use):

   ```bash
   # from this repo, after npm run build
   node .witboost/toolkit/setup.cjs --harness copilot --scope shared --shared-dir ~/witboost/tech-adapters
   ```

2. **Bootstrap a new adapter**, or attach an existing one, inside that folder:

   ```bash
   scripts/bootstrap-new-adapter.sh python ~/witboost/tech-adapters/witboost-my-adapter
   ```

3. **Open it in your IDE** (or open the shared folder itself) and say what you want to do next, e.g. `Define support for <feature> in this adapter.`

That's the whole flow. The rest of this README covers the reasoning behind
this layout, the alternatives (per-user install, self-contained repos), and
what to do at each phase.

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
[Recommended Layout](#recommended-layout). This will be the folder containing all your tech adapters!

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
  independent sibling repos and needs one-time wiring — see
  [Wiring Copilot to a Shared-Scope Install](docs/copilot-wiring.md) for the
  options. A repo produced by [New Adapter](#new-adapter) already has its own
  `.github/agents` and needs none of this.
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
this toolkit repository — ideally right inside your shared Witboost
workspace from [Install the Toolkit Once](#install-the-toolkit-once-recommended),
so agents/skills are already available with no extra step.

Bootstrap it with the helper script:

```bash
scripts/bootstrap-new-adapter.sh <java|python> /path/to/new-tech-adapter-repo
```

This clones the scaffold straight into the target path, strips exactly that
clone's git history, and initializes independent history — that's it. 
It then automatically runs `check-bootstrap.sh` in the target repo to verify 
scaffold structure.

If this specific adapter must be self-contained without the shared
workspace present (e.g. handed to someone who hasn't set it up, or cloned
in isolation), add `--standalone <harness...>` (requires `npm run build` /
`make build` to have run in this repo first, so `.witboost/toolkit/setup.cjs`
exists):

```bash
scripts/bootstrap-new-adapter.sh <java|python> /path/to/new-tech-adapter-repo --standalone copilot
```

This additionally copies this repository's `.witboost/` into the target and
runs the setup CLI there for every harness passed, so the target repo works
fully on its own.

Now you can open the path in your IDE and start working on the tech adapter leveraging the injected agents. Jump to [What To Do Next](#what-to-do-next) to pick the next phase.

### 🔗 Attach Existing Adapter

If the target repo already lives inside the shared parent folder from
[Install the Toolkit Once](#install-the-toolkit-once-recommended) and the
harness you use is wired up (Claude Code/Gemini CLI: automatic; Copilot: see
[Wiring Copilot to a Shared-Scope Install](docs/copilot-wiring.md); Codex:
the symlink or `CODEX_HOME`), there's nothing to install here
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
as the shared install above.

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

## 🧑‍💻 Contributing to This Toolkit

If you want to change how the toolkit itself works — the canonical agents,
skills, or the setup CLI's generators — see [CONTRIBUTING.md](CONTRIBUTING.md)
for the internal architecture, entry points, the full harness/scope path
table, and the development/validation commands. None of that is needed just
to use the toolkit on a tech adapter.

## 📝 Notes

- This toolkit is intentionally lightweight: no MCP server, no platform API client, no auth/token handling — it only reads canonical markdown/YAML and writes IDE-native files.
- It does not assume a specific cloud provider implementation.
- Foundations and playbooks are provider-neutral. Adapter-specific behavior must be recovered from the target repository; topic files provide the reusable design, review, and test rules.
