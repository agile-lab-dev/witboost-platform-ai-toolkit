import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { doctorWorkspace, setupWorkspace } from "../src/cli.js";
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

afterEach(() => {
  for (const path of workspaces.splice(0)) rmSync(path, { recursive: true, force: true });
});

describe("workspace setup", () => {
  it("creates all domain roots and a versioned manifest", () => {
    const target = workspace();
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
});
