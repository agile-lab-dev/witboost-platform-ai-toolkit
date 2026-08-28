import type { AgentDefinition, HarnessScope } from "./types.js";

/**
 * Build a Markdown section pointing to each skill's canonical reference docs.
 * Used only by harnesses that don't natively auto-discover SKILL.md folders
 * (gemini, codex) — copilot and claude get a native copy of the skill folder
 * instead (see setup/index.ts copySkillDirs).
 *
 * At workspace scope, `.witboost/skills/` genuinely exists in the target repo,
 * so the reference points there. At user/shared scope there is no `.witboost/`
 * next to the generated file, so setup/index.ts also copies the skill folder
 * next to it (under `skills/`) and this points there instead.
 */
export function buildSkillsSection(agent: AgentDefinition, scope: HarnessScope): string {
  if (agent.resolvedSkills.length === 0) return "";

  const lines = ["## Skills", ""];
  for (const skill of agent.resolvedSkills) {
    lines.push(`### ${skill.name}`);
    lines.push("");
    lines.push(skill.description);
    lines.push("");
    const ref =
      scope === "workspace"
        ? `.witboost/skills/${skill.name}/SKILL.md`
        : `skills/${skill.name}/SKILL.md`;
    lines.push(`Full reference: \`${ref}\``);
    lines.push("");
  }
  return lines.join("\n");
}

const MARKER_PREFIX = "witboost-tech-adapter-ai-toolkit";

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Upsert a marked block inside a shared, user-owned file (e.g. ~/.claude/CLAUDE.md)
 * without touching anything else in it. Used only for user-scope root instructions
 * files, which the user may already populate with their own unrelated content.
 */
export function upsertManagedBlock(existing: string | undefined, block: string): string {
  const start = `<!-- ${MARKER_PREFIX}:start (auto-generated, do not edit inside this block) -->`;
  const end = `<!-- ${MARKER_PREFIX}:end -->`;
  const wrapped = `${start}\n${block.trim()}\n${end}`;

  if (!existing) return `${wrapped}\n`;

  const pattern = new RegExp(`${escapeRegExp(start)}[\\s\\S]*?${escapeRegExp(end)}`);
  if (pattern.test(existing)) {
    return existing.replace(pattern, wrapped);
  }

  const separator = existing.endsWith("\n\n") ? "" : existing.endsWith("\n") ? "\n" : "\n\n";
  return `${existing}${separator}${wrapped}\n`;
}
