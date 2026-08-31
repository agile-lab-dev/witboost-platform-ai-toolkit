import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { parse as parseYaml } from "yaml";
import { loadConfig } from "../config/loader.js";
import type { WitboostConfig } from "../config/schema.js";
import { ClaudeGenerator } from "../generators/claude.js";
import { CodexGenerator } from "../generators/codex.js";
import { CopilotGenerator } from "../generators/copilot.js";
import { GeminiGenerator } from "../generators/gemini.js";
import { upsertManagedBlock } from "../generators/shared.js";
import type {
  AgentDefinition,
  GeneratedFile,
  HarnessGenerator,
  HarnessScope,
  SkillDefinition,
} from "../generators/types.js";

// ── CLI Argument Parsing ────────────────────────────────────────────

interface CliOptions {
  harness?: string[];
  dryRun: boolean;
  force: boolean;
  scope: HarnessScope;
  sharedDir?: string;
  configPath?: string;
  help: boolean;
}

function parseArgs(args: string[]): CliOptions {
  const opts: CliOptions = { dryRun: false, force: false, help: false, scope: "workspace" };
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--harness":
        opts.harness = [...(opts.harness ?? []), args[++i]];
        break;
      case "--dry-run":
        opts.dryRun = true;
        break;
      case "--force":
        opts.force = true;
        break;
      case "--config":
        opts.configPath = args[++i];
        break;
      case "--scope": {
        const value = args[++i];
        if (value !== "workspace" && value !== "user" && value !== "shared") {
          console.error(
            `✗ Invalid --scope value: "${value}" (expected "workspace", "user", or "shared")`,
          );
          process.exit(1);
        }
        opts.scope = value;
        break;
      }
      case "--shared-dir":
        opts.sharedDir = args[++i];
        break;
      case "--help":
      case "-h":
        opts.help = true;
        break;
    }
  }
  return opts;
}

function printHelp(): void {
  console.log(`
Witboost Tech Adapter AI Toolkit — Setup Script

Usage: node .witboost/toolkit/setup.cjs [options]

Options:
  --harness <name>    Generate files for a specific harness (copilot, claude, codex, gemini)
                      Can be specified multiple times. Default: from config.yml
  --scope <scope>     "workspace" (default, files land in this repo), "user"
                      (files land in the harness's own home-directory config,
                      e.g. ~/.claude, shared across every repo on the machine),
                      or "shared" (files land in --shared-dir, e.g. the common
                      parent folder of several sibling adapter repos)
  --shared-dir <path> Required when --scope is "shared". Directory to write to.
                      Claude Code and Gemini CLI auto-load their root file from
                      this directory if it's an ancestor of where you work;
                      Copilot and Codex need extra manual setup (see README).
  --dry-run           Show what files would be generated without writing them
  --force             Overwrite existing files/folders without prompting
  --config <path>     Path to config file (default: .witboost/config.yml)
  --help, -h          Show this help

Exit codes:
  0  Success
  1  Configuration error
  2  Generation error
`);
}

// ── Skill Loader ────────────────────────────────────────────────────

function loadSkillDefinitions(skillsDir: string): Map<string, SkillDefinition> {
  const skills = new Map<string, SkillDefinition>();
  if (!existsSync(skillsDir)) return skills;

  const entries = readdirSync(skillsDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const skillDir = join(skillsDir, entry.name);
    const skillPath = join(skillDir, "SKILL.md");
    if (!existsSync(skillPath)) {
      console.warn(`⚠ Skipping skill ${entry.name}: missing SKILL.md`);
      continue;
    }

    const raw = readFileSync(skillPath, "utf-8");
    const frontmatterMatch = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
    if (!frontmatterMatch) {
      console.warn(`⚠ Skipping skill ${entry.name}: no YAML frontmatter`);
      continue;
    }

    const meta = parseYaml(frontmatterMatch[1]) as Record<string, unknown>;
    const name = (meta.name as string) ?? entry.name;

    skills.set(name, {
      name,
      description: (meta.description as string) ?? "",
      dirPath: skillDir,
      content: raw,
    });
  }

  return skills;
}

// ── Agent Loader ────────────────────────────────────────────────────

function loadAgentDefinitions(
  agentsDir: string,
  skillsDir: string,
  includeCustom: boolean,
): AgentDefinition[] {
  const allSkills = loadSkillDefinitions(skillsDir);
  const agents: AgentDefinition[] = [];
  const subdirs = includeCustom ? ["core", "custom"] : ["core"];

  for (const sub of subdirs) {
    const dir = join(agentsDir, sub);
    if (!existsSync(dir)) continue;

    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const ymlPath = join(dir, entry.name, "agent.yml");
      const mdPath = join(dir, entry.name, "instructions.md");

      if (!existsSync(ymlPath)) {
        console.warn(`⚠ Skipping ${sub}/${entry.name}: missing agent.yml`);
        continue;
      }
      if (!existsSync(mdPath)) {
        console.warn(`⚠ Skipping ${sub}/${entry.name}: missing instructions.md`);
        continue;
      }

      const raw = parseYaml(readFileSync(ymlPath, "utf-8")) as Record<string, unknown>;
      const instructions = readFileSync(mdPath, "utf-8");

      const skillNames = (raw.skills as string[]) ?? [];
      const resolvedSkills: SkillDefinition[] = [];
      for (const sn of skillNames) {
        const skill = allSkills.get(sn);
        if (skill) {
          resolvedSkills.push(skill);
        } else {
          console.warn(`⚠ Agent ${entry.name}: unknown skill "${sn}"`);
        }
      }

      agents.push({
        name: raw.name as string,
        displayName: raw.displayName as string,
        description: raw.description as string,
        tools: (raw.tools as string[]) ?? [],
        skills: skillNames,
        resolvedSkills,
        category: (raw.category as string) ?? "lifecycle",
        instructions,
        harness: raw.harness as AgentDefinition["harness"],
        handoffs: raw.handoffs as string[] | undefined,
        hostOnly: raw.hostOnly as boolean | undefined,
      });
    }
  }

  return agents;
}

// ── Generator Registry ──────────────────────────────────────────────

const GENERATORS: Record<string, () => HarnessGenerator> = {
  copilot: () => new CopilotGenerator(),
  claude: () => new ClaudeGenerator(),
  codex: () => new CodexGenerator(),
  gemini: () => new GeminiGenerator(),
};

// Each harness's own home-directory config folder, used when scope is "user".
const USER_SCOPE_HOME_DIRS: Record<string, string> = {
  copilot: ".copilot",
  claude: ".claude",
  codex: ".codex",
  gemini: ".gemini",
};

// Folders skill directories get copied into, keyed by scope. At workspace
// scope, only copilot/claude natively auto-discover a repo-convention skills
// folder (gemini/codex instead embed a `.witboost/skills/...` text pointer,
// see buildSkillsSection). At user/shared scope there's no `.witboost/` next
// to the generated files, so every harness gets a colocated `skills/` copy
// that the text pointer can reference instead.
const NATIVE_SKILL_DIRS: Record<HarnessScope, Record<string, string>> = {
  workspace: { copilot: ".github/skills", claude: ".claude/skills" },
  user: { copilot: "skills", claude: "skills", gemini: "skills", codex: "skills" },
  shared: { copilot: "skills", claude: "skills", gemini: "skills", codex: "skills" },
};

// Resolves where generated files for a given harness/scope should be written.
function resolveOutputRoot(
  target: string,
  scope: HarnessScope,
  repoRoot: string,
  sharedDir: string | undefined,
): string {
  if (scope === "workspace") return repoRoot;

  if (scope === "shared") {
    if (!sharedDir) {
      throw new Error('--shared-dir is required when --scope is "shared"');
    }
    return resolve(sharedDir);
  }

  const homeSubdir = USER_SCOPE_HOME_DIRS[target];
  if (!homeSubdir) {
    throw new Error(`No known user-scope home directory for harness "${target}"`);
  }
  return join(homedir(), homeSubdir);
}

// Manual follow-up steps printed after a "shared" scope run: unlike "user"
// scope (a fixed, well-known home directory every harness already reads),
// --shared-dir is an arbitrary path, so only Claude Code and Gemini CLI pick
// it up with zero extra config (they load their root file from every
// directory above the working directory). Copilot and Codex need the user
// to wire the shared directory in themselves.
const SHARED_SCOPE_SETUP_HINTS: Record<string, string> = {
  copilot: [
    "✓ Wrote .vscode/settings.json in the shared directory — opening it directly",
    "  as your workspace root now works with no further action.",
    "⚠ Opening one adapter repo (or a multi-root .code-workspace) instead still",
    '  needs its own "chat.agentFilesLocations" / "chat.agentSkillsLocations" — see',
    "  docs/copilot-wiring.md.",
  ].join("\n"),
  claude: "✓ No further action needed — Claude Code auto-loads CLAUDE.md from this directory.",
  gemini: "✓ No further action needed — Gemini CLI auto-loads GEMINI.md from this directory.",
  codex: [
    "⚠ Codex does not read AGENTS.md above a repo's own git root. Symlink it per repo",
    "  (ln -s <shared-dir>/AGENTS.md <adapter-repo>/AGENTS.md) or set CODEX_HOME to it.",
  ].join("\n"),
};

// ── File / Directory Writers ─────────────────────────────────────────

function writeFile(outputRoot: string, file: GeneratedFile, opts: CliOptions): boolean {
  const fullPath = resolve(outputRoot, file.path);

  if (file.mergeStrategy === "managed-block") {
    if (opts.dryRun) {
      console.log(`  [merge] ${file.path}`);
      return false;
    }
    const existing = existsSync(fullPath) ? readFileSync(fullPath, "utf-8") : undefined;
    const merged = upsertManagedBlock(existing, file.content);
    mkdirSync(dirname(fullPath), { recursive: true });
    writeFileSync(fullPath, merged, "utf-8");
    console.log(`  [merge] ${file.path} (only the managed block was updated)`);
    return true;
  }

  if (opts.dryRun) {
    const exists = existsSync(fullPath);
    const action = exists ? (file.overwrite ? "overwrite" : "skip") : "create";
    console.log(`  [${action}] ${file.path}`);
    return false;
  }

  if (existsSync(fullPath) && !file.overwrite && !opts.force) {
    console.log(`  [skip] ${file.path} (exists, use --force to overwrite)`);
    return false;
  }

  mkdirSync(dirname(fullPath), { recursive: true });
  writeFileSync(fullPath, file.content, "utf-8");
  console.log(`  [write] ${file.path}`);
  return true;
}

function copySkillDirs(
  agents: AgentDefinition[],
  target: string,
  outputRoot: string,
  opts: CliOptions,
  scope: HarnessScope,
): number {
  const baseDir = NATIVE_SKILL_DIRS[scope][target];
  if (!baseDir) return 0;

  let count = 0;
  const seen = new Set<string>();
  for (const agent of agents) {
    for (const skill of agent.resolvedSkills) {
      if (seen.has(skill.name)) continue;
      seen.add(skill.name);

      const relDest = join(baseDir, skill.name);
      const destPath = join(outputRoot, relDest);

      if (opts.dryRun) {
        console.log(`  [copy] ${relDest}`);
        continue;
      }
      if (existsSync(destPath) && !opts.force) {
        console.log(`  [skip] ${relDest} (exists, use --force to overwrite)`);
        continue;
      }
      if (existsSync(destPath)) {
        rmSync(destPath, { recursive: true, force: true });
      }
      mkdirSync(dirname(destPath), { recursive: true });
      cpSync(skill.dirPath, destPath, { recursive: true });
      console.log(`  [copy] ${relDest}`);
      count++;
    }
  }
  return count;
}

// Copilot doesn't auto-discover a shared directory the way Claude/Gemini do
// (see HarnessScope), so at shared scope we write a ready .vscode/settings.json
// right in the shared directory: opening it as a workspace root then just
// works, no manual JSON editing needed. Uses bare relative keys ("agents"/
// "skills"), same as the shared dir's own root — resolves correctly only
// when the shared dir itself is the open workspace root; a single adapter
// repo or a multi-root .code-workspace still needs its own pointer (README).
// Merges into any existing settings.json instead of overwriting it, since
// this file may already hold unrelated user settings.
function writeSharedCopilotVscodeSettings(outputRoot: string, opts: CliOptions): boolean {
  const relPath = ".vscode/settings.json";
  const fullPath = resolve(outputRoot, relPath);

  if (opts.dryRun) {
    console.log(`  [merge] ${relPath}`);
    return false;
  }

  let settings: Record<string, unknown> = {};
  if (existsSync(fullPath)) {
    try {
      settings = JSON.parse(readFileSync(fullPath, "utf-8"));
    } catch {
      console.warn(`⚠ Skipping ${relPath}: existing file is not valid JSON, leaving it untouched`);
      return false;
    }
  }

  const filesKey = "chat.agentFilesLocations";
  const skillsKey = "chat.agentSkillsLocations";
  settings[filesKey] = { ...(settings[filesKey] as Record<string, boolean>), agents: true };
  settings[skillsKey] = { ...(settings[skillsKey] as Record<string, boolean>), skills: true };

  mkdirSync(dirname(fullPath), { recursive: true });
  writeFileSync(fullPath, `${JSON.stringify(settings, null, 2)}\n`, "utf-8");
  console.log(`  [merge] ${relPath}`);
  return true;
}

// ── Main ────────────────────────────────────────────────────────────

export async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const opts = parseArgs(args);

  if (opts.help) {
    printHelp();
    process.exit(0);
  }
  if (opts.scope === "shared" && !opts.sharedDir) {
    console.error('✗ --shared-dir is required when --scope is "shared"');
    process.exit(1);
  }

  let config: WitboostConfig;
  try {
    config = loadConfig(opts.configPath);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`✗ Configuration error: ${msg}`);
    process.exit(1);
  }

  // Determine output directory (repo root = cwd)
  const repoRoot = process.cwd();
  const witboostDir = join(repoRoot, ".witboost");
  const agentsDir = join(witboostDir, "agents");
  const skillsDir = join(witboostDir, "skills");

  // scripts/bootstrap-new-adapter.sh never gets copied into a target adapter
  // repo, so its presence is what distinguishes this toolkit's own host repo
  // from any repo .witboost/ was copied or bootstrapped into.
  const isHostRepo = existsSync(join(repoRoot, "scripts/bootstrap-new-adapter.sh"));
  const agents = loadAgentDefinitions(agentsDir, skillsDir, config.includeCustom).filter(
    (a) => !a.hostOnly || isHostRepo,
  );
  if (agents.length === 0) {
    console.error("✗ No agent definitions found in .witboost/agents/");
    process.exit(2);
  }
  console.log(`Found ${agents.length} agent(s): ${agents.map((a) => a.name).join(", ")}`);

  const targets = opts.harness ?? config.harnessTargets;

  let totalFiles = 0;
  for (const target of targets) {
    const factory = GENERATORS[target];
    if (!factory) {
      console.warn(
        `⚠ Unknown harness: ${target} (available: ${Object.keys(GENERATORS).join(", ")})`,
      );
      continue;
    }

    let outputRoot: string;
    try {
      outputRoot = resolveOutputRoot(target, opts.scope, repoRoot, opts.sharedDir);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`✗ ${msg}`);
      process.exit(2);
    }

    console.log(`
Generating ${target} files (scope: ${opts.scope}) → ${outputRoot}...`);
    const generator = factory();

    let files: GeneratedFile[];
    try {
      files = generator.generate(agents, config, repoRoot, opts.scope);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`✗ Generation error (${target}): ${msg}`);
      process.exit(2);
    }

    for (const file of files) {
      if (writeFile(outputRoot, file, opts)) totalFiles++;
    }

    totalFiles += copySkillDirs(agents, target, outputRoot, opts, opts.scope);

    if (opts.scope === "shared") {
      if (target === "copilot") {
        if (writeSharedCopilotVscodeSettings(outputRoot, opts)) totalFiles++;
      }
      const hint = SHARED_SCOPE_SETUP_HINTS[target];
      if (hint) console.log(`  ${hint}`);
    }
  }

  if (opts.dryRun) {
    console.log("\n(dry run — no files written)");
  } else {
    console.log(
      `\n✓ Generated ${totalFiles} file(s)/folder(s) for harness(es): ${targets.join(", ")}`,
    );
  }
}

main();
