import type { WitboostConfig } from "../config/schema.js";
import type { AgentDefinition, GeneratedFile, HarnessGenerator, OutputMode } from "./types.js";

export class ClaudeGenerator implements HarnessGenerator {
  harnessName = "claude";

  generate(
    agents: AgentDefinition[],
    _config: WitboostConfig,
    _repoRoot: string,
    mode: OutputMode = "folder",
  ): GeneratedFile[] {
    const sections = agents.map((agent) => this.buildSection(agent));

    // Skills are NOT embedded here — Claude Code natively auto-discovers
    // SKILL.md files copied to .claude/skills/ (see copySkillDirs).
    const claudeMd = [
      "# Witboost Tech Adapter AI Toolkit",
      "",
      "This project hosts the dedicated agent and skill package for Witboost tech adapter development.",
      "",
      ...sections,
    ].join("\n");

    return [
      {
        path: "CLAUDE.md",
        content: claudeMd,
        overwrite: true,
        mergeStrategy: mode === "folder" ? "managed-block" : "overwrite",
      },
    ];
  }

  private buildSection(agent: AgentDefinition): string {
    const subcommand = agent.harness?.claude?.subcommand ?? agent.name;

    return [
      `## ${agent.displayName}`,
      "",
      `Use \`/${subcommand}\` to activate this workflow.`,
      "",
      agent.instructions.trim(),
      "",
      "---",
      "",
    ].join("\n");
  }
}
