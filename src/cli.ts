#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  MANIFEST_SCHEMA_VERSION,
  type WorkspaceManifest,
  digest,
  readManifest,
  writeManifest,
} from "./manifest.js";
import { type TechAdapterLanguage, loadScaffolds } from "./scaffolds.js";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const packageJsonPath = join(packageRoot, "package.json");
const scaffoldsPath = join(packageRoot, "config/scaffolds.json");
const requiredSkills = ["witboost-toolkit", "witboost-tech-adapter"];

function packageVersion(): string {
  const pkg = JSON.parse(readFileSync(packageJsonPath, "utf8")) as { version: string };
  return pkg.version;
}

export function projectSkillIssues(workspace: string, toolkitVersion = packageVersion()): string[] {
  const lockPath = join(workspace, "skills-lock.json");
  if (!existsSync(lockPath)) {
    return [
      `Missing skills-lock.json in the workspace root. Install the Witboost skills with Project scope from ${workspace}.`,
    ];
  }

  let lock: { skills?: Record<string, { ref?: unknown }> };
  try {
    lock = JSON.parse(readFileSync(lockPath, "utf8")) as typeof lock;
  } catch {
    return [`Invalid skills lock JSON: ${lockPath}`];
  }
  if (!lock.skills || typeof lock.skills !== "object") {
    return [`Invalid skills lock: ${lockPath}`];
  }

  const expectedRef = `v${toolkitVersion}`;
  const issues: string[] = [];
  for (const skill of requiredSkills) {
    const entry = lock.skills[skill];
    if (!entry) {
      issues.push(`Missing project skill ${skill} in skills-lock.json.`);
    } else if (entry.ref !== expectedRef) {
      issues.push(`Project skill ${skill} uses ref ${String(entry.ref)}, expected ${expectedRef}.`);
    }
  }
  return issues;
}

function valueAfter(args: string[], flag: string): string | undefined {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
}

function workspaceFrom(args: string[]): string {
  return resolve(valueAfter(args, "--dir") ?? process.cwd());
}

function printHelp(): void {
  console.log(`Witboost Toolkit

Usage:
  witboost-toolkit setup --dir <workspace>
  witboost-toolkit doctor --dir <workspace>
  witboost-toolkit create tech-adapter <java|python> <name> --dir <workspace>
  witboost-toolkit --version

Install agent skills with Project scope from the same workspace directory before setup.`);
}

export function setupWorkspace(workspace: string, now = new Date()): void {
  const skillIssues = projectSkillIssues(workspace);
  if (skillIssues.length > 0) throw new Error(skillIssues.join("\n"));

  const managedDirectories = ["tech-adapters", "templates", "policies"];
  for (const directory of managedDirectories) {
    mkdirSync(join(workspace, directory), { recursive: true });
  }

  const scaffoldContent = readFileSync(scaffoldsPath, "utf8");
  writeManifest(workspace, {
    schemaVersion: MANIFEST_SCHEMA_VERSION,
    toolkitVersion: packageVersion(),
    updatedAt: now.toISOString(),
    managedDirectories,
    scaffoldsDigest: digest(scaffoldContent),
  });
}

export function doctorWorkspace(workspace: string): string[] {
  const issues: string[] = [];
  let manifest: WorkspaceManifest | undefined;
  try {
    manifest = readManifest(workspace);
  } catch (error) {
    return [error instanceof Error ? error.message : String(error)];
  }
  if (!manifest) return ["Missing .witboost-toolkit/manifest.json; run setup."];
  if (manifest.toolkitVersion !== packageVersion()) {
    issues.push(
      `Workspace uses toolkit ${manifest.toolkitVersion}, but doctor is ${packageVersion()}.`,
    );
  }
  issues.push(...projectSkillIssues(workspace));
  for (const directory of manifest.managedDirectories) {
    if (!existsSync(join(workspace, directory))) issues.push(`Missing ${directory}/.`);
  }
  const currentDigest = digest(readFileSync(scaffoldsPath, "utf8"));
  if (manifest.scaffoldsDigest !== currentDigest) {
    issues.push("Workspace was configured with a different scaffold catalog; run setup.");
  }
  return issues;
}

function runGit(args: string[], cwd?: string): string {
  try {
    return execFileSync("git", args, {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      throw new Error("Git is required to create a tech adapter but was not found in PATH.");
    }
    throw error;
  }
}

export function createTechAdapter(
  workspace: string,
  language: TechAdapterLanguage,
  name: string,
  catalogPath = scaffoldsPath,
): string {
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(name) || name === "." || name === "..") {
    throw new Error("Adapter name must be a safe single directory name.");
  }
  if (!readManifest(workspace)) throw new Error("Workspace is not configured; run setup first.");

  const definition = loadScaffolds(catalogPath).techAdapter[language];
  if (!definition) throw new Error(`Unsupported tech adapter language: ${language}`);

  const target = join(workspace, "tech-adapters", name);
  let ownsTarget = false;

  try {
    mkdirSync(target);
    ownsTarget = true;
    runGit(["init", "-q"], target);
    runGit(["remote", "add", "origin", definition.url], target);
    runGit(["fetch", "--depth", "1", "origin", definition.commit], target);
    runGit(["checkout", "--detach", "-q", "FETCH_HEAD"], target);
    const resolvedCommit = runGit(["rev-parse", "HEAD"], target);
    if (resolvedCommit !== definition.commit)
      throw new Error("Resolved scaffold commit does not match");
    for (const requiredPath of definition.requiredPaths) {
      if (!existsSync(join(target, requiredPath))) {
        throw new Error(`Scaffold is missing required path: ${requiredPath}`);
      }
    }

    const provenancePath = join(target, "docs/scaffold-provenance.json");
    mkdirSync(dirname(provenancePath), { recursive: true });
    writeFileSync(
      provenancePath,
      `${JSON.stringify(
        {
          schemaVersion: 1,
          entity: "tech-adapter",
          language,
          source: definition.url,
          commit: resolvedCommit,
          toolkitVersion: packageVersion(),
          createdAt: new Date().toISOString(),
        },
        null,
        2,
      )}\n`,
      "utf8",
    );

    rmSync(join(target, ".git"), { recursive: true, force: true });
    runGit(["init", "-q"], target);
    runGit(["add", "-A"], target);
    runGit(
      [
        "-c",
        "user.name=Witboost Toolkit",
        "-c",
        "user.email=toolkit@witboost.com",
        "-c",
        "commit.gpgsign=false",
        "commit",
        "-q",
        "-m",
        `Create tech adapter from ${language} scaffold`,
      ],
      target,
    );
    return target;
  } catch (error) {
    if (ownsTarget) rmSync(target, { recursive: true, force: true });
    if (error instanceof Error && "code" in error && error.code === "EEXIST") {
      throw new Error(`Target already exists: ${target}`);
    }
    throw error;
  }
}

export function main(args = process.argv.slice(2)): number {
  if (args.includes("--version") || args.includes("-v")) {
    console.log(packageVersion());
    return 0;
  }
  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    printHelp();
    return 0;
  }

  const workspace = workspaceFrom(args);
  if (args[0] === "setup") {
    setupWorkspace(workspace);
    console.log(`Configured Witboost workspace: ${workspace}`);
    return 0;
  }
  if (args[0] === "doctor") {
    const issues = doctorWorkspace(workspace);
    if (issues.length === 0) {
      console.log(`Workspace is healthy: ${workspace}`);
      return 0;
    }
    for (const issue of issues) console.error(`- ${issue}`);
    return 1;
  }
  if (args[0] === "create" && args[1] === "tech-adapter") {
    const language = args[2] as TechAdapterLanguage;
    const name = args[3];
    if (!language || !name) throw new Error("Expected language and adapter name.");
    console.log(`Created tech adapter: ${createTechAdapter(workspace, language, name)}`);
    return 0;
  }

  throw new Error(`Unknown command: ${args.join(" ")}`);
}

export function isCliEntryPoint(
  entryPath: string,
  modulePath = fileURLToPath(import.meta.url),
): boolean {
  try {
    return realpathSync(entryPath) === realpathSync(modulePath);
  } catch {
    return false;
  }
}

if (process.argv[1] && isCliEntryPoint(process.argv[1])) {
  try {
    process.exitCode = main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
