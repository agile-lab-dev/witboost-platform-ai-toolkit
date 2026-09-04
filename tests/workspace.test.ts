import { existsSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  doctorWorkspace,
  isCliEntryPoint,
  projectSkillIssues,
  setupWorkspace,
} from "../src/cli.js";
import { MANIFEST_PATH, readManifest } from "../src/manifest.js";

const workspaces: string[] = [];
const packageVersion = (
  JSON.parse(readFileSync(resolve(__dirname, "../package.json"), "utf8")) as { version: string }
).version;

function workspace(): string {
  const path = join(tmpdir(), `witboost-toolkit-${crypto.randomUUID()}`);
  workspaces.push(path);
  return path;
}

function installProjectSkills(target: string, version = packageVersion): void {
  mkdirSync(target, { recursive: true });
  writeFileSync(
    join(target, "skills-lock.json"),
    `${JSON.stringify({
      version: 1,
      skills: {
        "witboost-toolkit": { ref: `v${version}` },
        "witboost-tech-adapter": { ref: `v${version}` },
      },
    })}\n`,
  );
}

afterEach(() => {
  for (const path of workspaces.splice(0)) rmSync(path, { recursive: true, force: true });
});

describe("workspace setup", () => {
  it("recognizes the CLI when npm invokes it through a symlink", () => {
    const target = workspace();
    mkdirSync(target, { recursive: true });
    const cliPath = resolve(__dirname, "../src/cli.ts");
    const binPath = join(target, "witboost-toolkit");
    symlinkSync(cliPath, binPath);

    expect(isCliEntryPoint(binPath, cliPath)).toBe(true);
  });

  it("creates all domain roots and a versioned manifest", () => {
    const target = workspace();
    installProjectSkills(target);
    setupWorkspace(target, new Date("2026-09-03T12:00:00.000Z"));

    for (const directory of ["tech-adapters", "templates", "policies"]) {
      expect(existsSync(join(target, directory))).toBe(true);
    }
    expect(existsSync(join(target, MANIFEST_PATH))).toBe(true);
    expect(readManifest(target)).toMatchObject({
      schemaVersion: 1,
      toolkitVersion: packageVersion,
      updatedAt: "2026-09-03T12:00:00.000Z",
    });
    expect(doctorWorkspace(target)).toEqual([]);
  });

  it("repairs missing managed directories without touching unrelated files", () => {
    const target = workspace();
    installProjectSkills(target);
    setupWorkspace(target);
    rmSync(join(target, "policies"), { recursive: true });
    expect(doctorWorkspace(target)).toContain("Missing policies/.");

    setupWorkspace(target);
    expect(doctorWorkspace(target)).toEqual([]);
    expect(JSON.parse(readFileSync(join(target, MANIFEST_PATH), "utf8"))).toBeTruthy();
  });

  it("reports malformed manifests without throwing", () => {
    const target = workspace();
    mkdirSync(join(target, ".witboost-toolkit"), { recursive: true });
    writeFileSync(join(target, MANIFEST_PATH), "{}\n");
    expect(doctorWorkspace(target)[0]).toContain("Invalid workspace manifest");
  });

  it("rejects setup in a directory different from the project skill installation", () => {
    const skillProject = workspace();
    const target = workspace();
    installProjectSkills(skillProject);

    expect(() => setupWorkspace(target)).toThrow("Missing skills-lock.json");
    expect(existsSync(join(target, MANIFEST_PATH))).toBe(false);
  });

  it("reports missing and mismatched project skills", () => {
    const target = workspace();
    mkdirSync(target, { recursive: true });
    writeFileSync(
      join(target, "skills-lock.json"),
      `${JSON.stringify({
        version: 1,
        skills: { "witboost-toolkit": { ref: "v0.1.0" } },
      })}\n`,
    );

    expect(projectSkillIssues(target)).toEqual([
      `Project skill witboost-toolkit uses ref v0.1.0, expected v${packageVersion}.`,
      "Missing project skill witboost-tech-adapter in skills-lock.json.",
    ]);
  });
});
