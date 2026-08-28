import type { WitboostConfig } from "../config/schema.js";
import { buildSkillsSection } from "./shared.js";
import type { AgentDefinition, GeneratedFile, HarnessGenerator, HarnessScope } from "./types.js";

export class CodexGenerator implements HarnessGenerator {
  harnessName = "codex";

  generate(
    agents: AgentDefinition[],
    _config: WitboostConfig,
    _repoRoot: string,
    scope: HarnessScope = "workspace",
  ): GeneratedFile[] {
    const sections = agents.map((agent) => this.buildSection(agent, scope));

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
        // At user/shared scope, AGENTS.md is a single shared file that may
        // already hold unrelated content — merge, don't clobber it.
        mergeStrategy: scope !== "workspace" ? "managed-block" : "overwrite",
      },
    ];
  }

  private buildSection(agent: AgentDefinition, scope: HarnessScope): string {
    const section = agent.harness?.codex?.section ?? agent.name;

    return [
      `## ${agent.displayName} (\`${section}\`)`,
      "",
      agent.instructions.trim(),
      "",
      buildSkillsSection(agent, scope),
      "---",
      "",
    ].join("\n");
  }
}
