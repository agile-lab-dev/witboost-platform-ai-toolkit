import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parse as parseYaml } from "yaml";

const root = resolve(__dirname, "..");
const skillsRoot = resolve(root, "skills");
const expectedSkills = [
  "witboost-toolkit",
  "witboost-tech-adapter",
  "witboost-template",
  "witboost-policy",
];

function markdownFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = resolve(directory, entry);
    return statSync(path).isDirectory() ? markdownFiles(path) : path.endsWith(".md") ? [path] : [];
  });
}

describe("domain skills", () => {
  it("publishes the router and every planned domain", () => {
    for (const skill of expectedSkills) {
      const path = resolve(skillsRoot, skill, "SKILL.md");
      expect(existsSync(path), `missing ${skill}`).toBe(true);
      const raw = readFileSync(path, "utf8");
      const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
      expect(match, `${skill} has no frontmatter`).not.toBeNull();
      const metadata = parseYaml(match?.[1] ?? "") as Record<string, unknown>;
      expect(metadata.name).toBe(skill);
      expect(metadata.description).toBeTruthy();
    }
  });

  it("keeps future domains internal until their playbooks exist", () => {
    for (const skill of ["witboost-template", "witboost-policy"]) {
      const raw = readFileSync(resolve(skillsRoot, skill, "SKILL.md"), "utf8");
      const metadata = parseYaml(raw.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? "") as {
        metadata?: { internal?: boolean };
      };
      expect(metadata.metadata?.internal).toBe(true);
      expect(raw).toContain("intentionally incomplete");
    }
  });

  it("keeps local Markdown links resolvable", () => {
    const pattern = /\[[^\]]*\]\((?!https?:|mailto:)([^)#]+\.md)(?:#[^)]+)?\)/g;
    for (const file of markdownFiles(skillsRoot)) {
      const content = readFileSync(file, "utf8");
      for (const match of content.matchAll(pattern)) {
        expect(existsSync(resolve(dirname(file), match[1])), `${file}: ${match[1]}`).toBe(true);
      }
    }
  });

  it("keeps the tech adapter pack complete", () => {
    const skillRoot = resolve(skillsRoot, "witboost-tech-adapter");
    for (const playbook of [
      "create-tech-adapter",
      "assess",
      "high-level-design",
      "new-feature",
      "review",
      "implement",
      "test",
    ]) {
      expect(existsSync(resolve(skillRoot, `references/playbooks/${playbook}.md`))).toBe(true);
    }
  });
});
