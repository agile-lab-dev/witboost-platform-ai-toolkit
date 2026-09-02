import type { WitboostConfig } from "../config/schema.js";
import { buildSkillsSection } from "./shared.js";
import type { AgentDefinition, GeneratedFile, HarnessGenerator, OutputMode } from "./types.js";

export class GeminiGenerator implements HarnessGenerator {
  harnessName = "gemini";

  generate(
    agents: AgentDefinition[],
    _config: WitboostConfig,
    _repoRoot: string,
    mode: OutputMode = "folder",
  ): GeneratedFile[] {
    const files: GeneratedFile[] = [];
    const importLines: string[] = [];
    const prefix = mode === "self-host" ? ".gemini/" : "";

    for (const agent of agents) {
      const fileName = `${agent.name}.md`;
      const content = [
        `# ${agent.displayName}`,
        "",
        agent.instructions.trim(),
        "",
        buildSkillsSection(agent, mode),
      ].join("\n");

      files.push({
        path: `${prefix}instructions/${fileName}`,
        content,
        overwrite: true,
      });

      importLines.push(`@${prefix}instructions/${fileName}`);
    }

    const geminiMd = [
      "# Witboost Tech Adapter AI Toolkit",
      "",
      "This project hosts the dedicated agent and skill package for Witboost tech adapter development.",
      "",
      ...importLines,
      "",
    ].join("\n");

    files.push({
      path: "GEMINI.md",
      content: geminiMd,
      overwrite: true,
      mergeStrategy: mode === "folder" ? "managed-block" : "overwrite",
    });

    return files;
  }
}
