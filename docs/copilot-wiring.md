# Wiring Copilot to a Shared-Scope Install

This covers Copilot specifically for a [shared-scope install](../README.md#install-the-toolkit-once-recommended).
Claude Code and Gemini CLI auto-discover a shared parent folder for every
repo nested under it; Copilot doesn't, because there's no such thing as an
arbitrary "ancestor folder" auto-discovery for it. A repo produced by
[New Adapter](../README.md#new-adapter) already has its own `.github/agents`
and needs none of this — this only matters when you rely on the shared
install instead (e.g. [Attach Existing Adapter](../README.md#attach-existing-adapter)
without a local copy, or opening the shared folder itself).

Pick the option that matches how you open adapters:

- **Always open the shared folder itself** as your workspace root: handled
  automatically. The install command already writes a `.vscode/settings.json`
  into the shared folder with `chat.agentFilesLocations` / `chat.agentSkillsLocations`
  set to bare relative names (`{"agents": true}` / `{"skills": true}`,
  committable to git). Just open that folder and go.
- **Multi-root workspace** covering several adapters: add both keys to its
  `.code-workspace` file's `settings` block, e.g.
  `"chat.agentFilesLocations": { "~/witboost/tech-adapters/agents": true }`
  (and the `agentSkillsLocations` equivalent for `skills`).
- **One adapter repo at a time**: useful when you open a single adapter repo
  on its own (no multi-root workspace, not the shared folder itself). Add
  the same two keys to that repo's own `.vscode/settings.json` — a one-line
  pointer, not a content copy, so Copilot still reads the shared
  agents/skills instead of a local duplicate. Committable to git, so the
  whole team gets it for free just by opening that repo.
