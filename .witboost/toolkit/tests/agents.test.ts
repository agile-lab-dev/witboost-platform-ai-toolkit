import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parse as parseYaml } from "yaml";

const repoRoot = resolve(__dirname, "../../..");
const agentDir = resolve(repoRoot, ".witboost/agents/core/witboost-tech-adapter-ai-toolkit");
const skillDir = resolve(repoRoot, ".witboost/skills/witboost-tech-adapter-ai-toolkit");

const requiredReferences = [
  "references/foundations/repository-model.md",
  "references/foundations/lifecycle-contract.md",
  "references/playbooks/bootstrap.md",
  "references/playbooks/attach.md",
  "references/playbooks/high-level-design.md",
  "references/playbooks/new-feature.md",
  "references/playbooks/review.md",
  "references/playbooks/implement.md",
  "references/playbooks/test.md",
  "references/topics/naming-convention.md",
  "references/topics/workload-artifact-contract.md",
  "references/topics/descriptor-vs-configuration.md",
  "references/topics/sync-vs-async.md",
  "references/topics/update-acl-and-access-grants.md",
  "references/topics/idempotency-and-retries.md",
  "references/topics/observability.md",
  "assets/decision-log-entry.md",
  "assets/new-adapter-brief.md",
  "assets/attach-report.md",
  "assets/high-level-design-brief.md",
  "assets/test-matrix.md",
];

const topicDir = resolve(skillDir, "references/topics");
const topicFiles = readdirSync(topicDir)
  .filter((file) => file.endsWith(".md"))
  .map((file) => resolve(topicDir, file));

const markdownFiles = requiredReferences
  .map((file) => resolve(skillDir, file))
  .concat(resolve(skillDir, "SKILL.md"));

describe("canonical agent definition", () => {
  it("has valid agent.yml frontmatter", () => {
    const raw = parseYaml(readFileSync(resolve(agentDir, "agent.yml"), "utf-8")) as Record<
      string,
      unknown
    >;
    expect(raw.name).toBe("witboost-tech-adapter-ai-toolkit");
    expect(raw.displayName).toBeTruthy();
    expect(raw.description).toBeTruthy();
    expect(raw.skills).toContain("witboost-tech-adapter-ai-toolkit");
  });

  it("documents both repository modes", () => {
    const content = readFileSync(resolve(agentDir, "instructions.md"), "utf-8");
    expect(content).toMatch(/new adapter|new tech adapter/);
    expect(content).toMatch(/attach existing adapter|attach to an existing/);
  });
});

describe("canonical skill definition", () => {
  it("has YAML frontmatter with name and description", () => {
    const raw = readFileSync(resolve(skillDir, "SKILL.md"), "utf-8");
    const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
    expect(match).not.toBeNull();
    if (!match) throw new Error("missing YAML frontmatter");
    const meta = parseYaml(match[1]) as Record<string, unknown>;
    expect(meta.name).toBe("witboost-tech-adapter-ai-toolkit");
    expect(meta.description).toBeTruthy();
  });

  it("contains all required package documents", () => {
    for (const ref of requiredReferences) {
      expect(existsSync(resolve(skillDir, ref)), `missing ${ref}`).toBe(true);
    }
  });

  it("routes to every required document", () => {
    const content = readFileSync(resolve(skillDir, "SKILL.md"), "utf-8");
    for (const ref of requiredReferences) {
      expect(content, `SKILL.md does not route to ${ref}`).toContain(`./${ref}`);
    }
  });

  it("keeps every topic in the canonical four-section shape", () => {
    for (const file of topicFiles) {
      const content = readFileSync(file, "utf-8");
      for (const section of ["Concept", "Design Decision", "Review Signals", "Test Coverage"]) {
        expect(content, `${file} is missing ## ${section}`).toMatch(
          new RegExp(`^## ${section}$`, "m"),
        );
      }
    }
  });

  it("has no broken local Markdown file links", () => {
    const linkPattern = /\[[^\]]*\]\((?!https?:|mailto:)([^)#]+\.md)(?:#[^)]+)?\)/g;
    for (const file of markdownFiles.concat(topicFiles)) {
      const content = readFileSync(file, "utf-8");
      for (const match of content.matchAll(linkPattern)) {
        const target = resolve(dirname(file), match[1]);
        expect(existsSync(target), `${file} links to missing ${match[1]}`).toBe(true);
      }
    }
  });

  it("keeps foundations and playbooks adapter-neutral", () => {
    const normativeFiles = requiredReferences
      .filter(
        (file) =>
          file.startsWith("references/foundations/") || file.startsWith("references/playbooks/"),
      )
      .map((file) => resolve(skillDir, file));
    for (const file of normativeFiles) {
      const content = readFileSync(file, "utf-8");
      expect(content, `${file} contains Fullcode-specific guidance`).not.toMatch(/fullcode/i);
      expect(content, `${file} contains Azure-specific guidance`).not.toMatch(/\bazure\b/i);
    }
  });
});
