import type { AgentDefinition, OutputMode } from "./types.js";

/**
 * Build a Markdown section pointing to each skill's canonical reference docs.
 * Used only by harnesses that don't natively auto-discover SKILL.md folders
 * (gemini, codex) — copilot and claude get a native copy of the skill folder
 * instead (see setup/index.ts copySkillDirs).
 *
 * Self-hosted output points at the canonical `.witboost/skills/`; workspace
 * output points at the colocated generated `skills/` copy.
 */
export function buildSkillsSection(agent: AgentDefinition, mode: OutputMode): string {
  if (agent.resolvedSkills.length === 0) return "";

  const lines = ["## Skills", ""];
  for (const skill of agent.resolvedSkills) {
    lines.push(`### ${skill.name}`);
    lines.push("");
    lines.push(skill.description);
    lines.push("");
    const ref =
      mode === "self-host"
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
 * Upsert a marked block in a workspace-owned instructions file without
 * touching unrelated content around it.
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
