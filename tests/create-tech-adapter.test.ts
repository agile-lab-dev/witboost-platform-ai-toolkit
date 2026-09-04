import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createTechAdapter, setupWorkspace } from "../src/cli.js";

const temporaryDirectories: string[] = [];

function temporaryDirectory(name: string): string {
  const path = join(tmpdir(), `${name}-${crypto.randomUUID()}`);
  mkdirSync(path, { recursive: true });
  temporaryDirectories.push(path);
  return path;
}

function git(args: string[], cwd: string): string {
  return execFileSync("git", args, { cwd, encoding: "utf8" }).trim();
}

afterEach(() => {
  for (const path of temporaryDirectories.splice(0)) {
    rmSync(path, { recursive: true, force: true });
  }
});

describe("tech adapter creation", () => {
  it("uses an exact scaffold revision and records provenance", () => {
    const scaffold = temporaryDirectory("witboost-scaffold");
    mkdirSync(join(scaffold, "tech-adapter"));
    writeFileSync(join(scaffold, "tech-adapter/pyproject.toml"), "[project]\nname='fixture'\n");
    git(["init", "-q"], scaffold);
    git(["add", "-A"], scaffold);
    git(
      [
        "-c",
        "user.name=Fixture",
        "-c",
        "user.email=fixture@example.com",
        "commit",
        "-q",
        "-m",
        "fixture",
      ],
      scaffold,
    );
    const commit = git(["rev-parse", "HEAD"], scaffold);

    const catalogPath = join(temporaryDirectory("witboost-catalog"), "scaffolds.json");
    writeFileSync(
      catalogPath,
      JSON.stringify({
        schemaVersion: 1,
        techAdapter: {
          python: {
            url: scaffold,
            commit,
            requiredPaths: ["tech-adapter/pyproject.toml"],
          },
        },
      }),
    );

    const workspace = temporaryDirectory("witboost-workspace");
    setupWorkspace(workspace);
    const target = createTechAdapter(workspace, "python", "fixture-adapter", catalogPath);

    expect(existsSync(join(target, ".git"))).toBe(true);
    expect(git(["rev-list", "--count", "HEAD"], target)).toBe("1");
    const provenance = JSON.parse(
      readFileSync(join(target, "docs/scaffold-provenance.json"), "utf8"),
    ) as { commit: string; source: string };
    expect(provenance).toMatchObject({ commit, source: scaffold });
  });

  it("never removes a pre-existing target", () => {
    const workspace = temporaryDirectory("witboost-workspace");
    setupWorkspace(workspace);
    const target = join(workspace, "tech-adapters/existing");
    mkdirSync(target);
    writeFileSync(join(target, "keep.txt"), "keep");

    expect(() => createTechAdapter(workspace, "python", "existing")).toThrow(
      "Target already exists",
    );
    expect(readFileSync(join(target, "keep.txt"), "utf8")).toBe("keep");
  });
});
