import {
  chmodSync,
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
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
  OutputMode,
  SkillDefinition,
} from "../generators/types.js";

// ── CLI Argument Parsing ────────────────────────────────────────────

interface CliOptions {
  harness?: string[];
  dryRun: boolean;
  force: boolean;
  targetDir?: string;
  selfHost: boolean;
  configPath?: string;
  help: boolean;
}

function parseArgs(args: string[]): CliOptions {
  const opts: CliOptions = { dryRun: false, force: false, help: false, selfHost: false };
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
      case "--dir":
        opts.targetDir = args[++i];
        break;
      case "--self-host":
        opts.selfHost = true;
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
  --dir <path>        Witboost workspace folder to configure
  --self-host         Contributor-only: regenerate tracked files in this repository
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

const NATIVE_SKILL_DIRS: Record<OutputMode, Record<string, string>> = {
  "self-host": { copilot: ".github/skills", claude: ".claude/skills" },
  folder: { copilot: "skills", claude: "skills", gemini: "skills", codex: "skills" },
};

// Harness-specific follow-up after configuring the workspace folder.
const FOLDER_SETUP_HINTS: Record<string, string> = {
  copilot: [
    "✓ Wrote .vscode/settings.json in the workspace — opening it directly",
    "  as your workspace root now works with no further action.",
    "⚠ Opening one adapter repo (or a multi-root .code-workspace) instead still",
    '  needs its own "chat.agentFilesLocations" / "chat.agentSkillsLocations" — see',
    "  the Copilot wiring guide in the toolkit repository.",
  ].join("\n"),
  claude: "✓ No further action needed — Claude Code auto-loads CLAUDE.md from this directory.",
  gemini: "✓ No further action needed — Gemini CLI auto-loads GEMINI.md from this directory.",
  codex: [
    "⚠ Codex does not read AGENTS.md above a repo's own git root. Symlink it per repo",
    "  (ln -s <workspace>/AGENTS.md <adapter-repo>/AGENTS.md) or set CODEX_HOME to it.",
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
  mode: OutputMode,
): number {
  const baseDir = NATIVE_SKILL_DIRS[mode][target];
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
      if (mode === "self-host" && existsSync(destPath) && !opts.force) {
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

// Copilot does not discover an arbitrary parent folder, so write a ready
// .vscode/settings.json into the configured workspace. Opening that folder
// works, no manual JSON editing needed. Uses bare relative keys ("agents"/
// "skills"), which resolve correctly when the workspace is open; a single adapter
// repo or a multi-root .code-workspace still needs its own pointer (README).
// Merges into any existing settings.json instead of overwriting it, since
// this file may already hold unrelated user settings.
function writeWorkspaceCopilotSettings(outputRoot: string, opts: CliOptions): boolean {
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

function prepareWorkspaceFolder(repoRoot: string, outputRoot: string, opts: CliOptions): number {
  const assetDirs = ["tech-adapters", "templates"];
  if (opts.dryRun) {
    for (const dir of assetDirs) console.log(`  [create] ${dir}/`);
    console.log("  [copy] scripts/create-tech-adapter.sh");
    return 0;
  }

  for (const dir of assetDirs) mkdirSync(join(outputRoot, dir), { recursive: true });
  const scriptDir = join(outputRoot, "scripts");
  mkdirSync(scriptDir, { recursive: true });
  cpSync(
    join(repoRoot, "scripts/create-tech-adapter.sh"),
    join(scriptDir, "create-tech-adapter.sh"),
  );
  chmodSync(join(scriptDir, "create-tech-adapter.sh"), 0o755);
  console.log(
    "  [workspace] ensured tech-adapters/, templates/, and scripts/create-tech-adapter.sh",
  );
  return 1;
}

// ── Main ────────────────────────────────────────────────────────────

export async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const opts = parseArgs(args);

  if (opts.help) {
    printHelp();
    process.exit(0);
  }
  if (opts.selfHost === Boolean(opts.targetDir)) {
    console.error("✗ Specify exactly one of --dir <path> or --self-host");
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

  const repoRoot = process.cwd();
  const mode: OutputMode = opts.selfHost ? "self-host" : "folder";
  const outputRoot = opts.selfHost ? repoRoot : resolve(opts.targetDir as string);
  const witboostDir = join(repoRoot, ".witboost");
  const agentsDir = join(witboostDir, "agents");
  const skillsDir = join(witboostDir, "skills");

  const agents = loadAgentDefinitions(agentsDir, skillsDir, config.includeCustom);
  if (agents.length === 0) {
    console.error("✗ No agent definitions found in .witboost/agents/");
    process.exit(2);
  }
  console.log(`Found ${agents.length} agent(s): ${agents.map((a) => a.name).join(", ")}`);

  const targets = opts.harness ?? config.harnessTargets;

  let totalFiles = mode === "folder" ? prepareWorkspaceFolder(repoRoot, outputRoot, opts) : 0;
  for (const target of targets) {
    const factory = GENERATORS[target];
    if (!factory) {
      console.warn(
        `⚠ Unknown harness: ${target} (available: ${Object.keys(GENERATORS).join(", ")})`,
      );
      continue;
    }

    console.log(`
Generating ${target} files → ${outputRoot}...`);
    const generator = factory();

    let files: GeneratedFile[];
    try {
      files = generator.generate(agents, config, repoRoot, mode);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`✗ Generation error (${target}): ${msg}`);
      process.exit(2);
    }

    for (const file of files) {
      if (writeFile(outputRoot, file, opts)) totalFiles++;
    }

    totalFiles += copySkillDirs(agents, target, outputRoot, opts, mode);

    if (mode === "folder") {
      if (target === "copilot") {
        if (writeWorkspaceCopilotSettings(outputRoot, opts)) totalFiles++;
      }
      const hint = FOLDER_SETUP_HINTS[target];
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
