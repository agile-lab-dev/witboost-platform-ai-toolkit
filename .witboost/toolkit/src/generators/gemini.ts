import type { WitboostConfig } from "../config/schema.js";
import { buildSkillsSection } from "./shared.js";
import type { AgentDefinition, GeneratedFile, HarnessGenerator, HarnessScope } from "./types.js";

export class GeminiGenerator implements HarnessGenerator {
  harnessName = "gemini";

  generate(
    agents: AgentDefinition[],
    _config: WitboostConfig,
    _repoRoot: string,
    scope: HarnessScope = "workspace",
  ): GeneratedFile[] {
    const files: GeneratedFile[] = [];
    const importLines: string[] = [];
    // Workspace output lives under .gemini/ (repo convention); user/shared-scope
    // output is already rooted at the harness's own dir, so no extra prefix needed.
    const prefix = scope === "workspace" ? ".gemini/" : "";

    for (const agent of agents) {
      const fileName = `${agent.name}.md`;
      const content = [
        `# ${agent.displayName}`,
        "",
        agent.instructions.trim(),
        "",
        buildSkillsSection(agent, scope),
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
      // At user/shared scope, GEMINI.md is a single shared file that may
      // already hold unrelated content — merge, don't clobber it.
      mergeStrategy: scope !== "workspace" ? "managed-block" : "overwrite",
    });

    return files;
  }
}
