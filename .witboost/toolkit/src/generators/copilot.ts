import type { WitboostConfig } from "../config/schema.js";
import type { AgentDefinition, GeneratedFile, HarnessGenerator, OutputMode } from "./types.js";

export class CopilotGenerator implements HarnessGenerator {
  harnessName = "copilot";

  generate(
    agents: AgentDefinition[],
    _config: WitboostConfig,
    _repoRoot: string,
    mode: OutputMode = "folder",
  ): GeneratedFile[] {
    const files: GeneratedFile[] = [];
    const prefix = mode === "self-host" ? ".github/" : "";

    for (const agent of agents) {
      // <prefix>agents/<name>.agent.md
      // Skills are NOT embedded here — Copilot natively auto-discovers
      // SKILL.md files copied to <prefix>skills/ (see copySkillDirs).
      files.push({
        path: `${prefix}agents/${agent.name}.agent.md`,
        content: this.buildAgentMd(agent),
        overwrite: true,
      });
    }

    return files;
  }

  private buildAgentMd(agent: AgentDefinition): string {
    const toolsLine = agent.tools.length > 0 ? `[${agent.tools.join(", ")}]` : "[]";
    const argumentHint = (agent.harness?.copilot?.argumentHint ?? agent.description)
      .replace(/\n/g, " ")
      .trim()
      .replace(/"/g, "'");
    const description = agent.description.replace(/\n/g, " ").trim().replace(/"/g, "'");

    const lines = [
      "---",
      `name: ${agent.displayName}`,
      `description: "${description}"`,
      `tools: ${toolsLine}`,
      `argument-hint: "${argumentHint}"`,
      "agents: []",
    ];
    if (agent.handoffs && agent.handoffs.length > 0) {
      lines.push(`handoffs: [${agent.handoffs.join(", ")}]`);
    }
    lines.push("---", "", agent.instructions.trim(), "");
    return lines.join("\n");
  }
}
