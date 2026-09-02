# Copilot Wiring

Opening the configured Witboost workspace folder requires no manual setup. The setup CLI writes `.vscode/settings.json` with relative `agents/` and `skills/` locations.

Extra wiring is needed only when the workspace root is not open:

- For a multi-root `.code-workspace`, point `chat.agentFilesLocations` and `chat.agentSkillsLocations` at the workspace folder's `agents/` and `skills/` directories.
- For one adapter repository opened alone, put the same two pointers in that repository's `.vscode/settings.json`.

These settings are pointers to the central installation, not copies of toolkit content.
