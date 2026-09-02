import type { WitboostConfig } from "../config/schema.js";
import { buildSkillsSection } from "./shared.js";
import type { AgentDefinition, GeneratedFile, HarnessGenerator, OutputMode } from "./types.js";

export class CodexGenerator implements HarnessGenerator {
  harnessName = "codex";

  generate(
    agents: AgentDefinition[],
    _config: WitboostConfig,
    _repoRoot: string,
    mode: OutputMode = "folder",
  ): GeneratedFile[] {
    const sections = agents.map((agent) => this.buildSection(agent, mode));

    const agentsMd = [
      "# Witboost Tech Adapter AI Toolkit — Agent Definitions",
      "",
      "This file defines the AI coding agent(s) for Witboost tech adapter development.",
      "",
      ...sections,
    ].join("\n");

    return [
      {
        path: "AGENTS.md",
        content: agentsMd,
        overwrite: true,
        mergeStrategy: mode === "folder" ? "managed-block" : "overwrite",
      },
    ];
  }

  private buildSection(agent: AgentDefinition, mode: OutputMode): string {
    const section = agent.harness?.codex?.section ?? agent.name;

    return [
      `## ${agent.displayName} (\`${section}\`)`,
      "",
      agent.instructions.trim(),
      "",
      buildSkillsSection(agent, mode),
      "---",
      "",
    ].join("\n");
  }
}
