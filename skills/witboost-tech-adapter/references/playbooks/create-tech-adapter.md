# Create Tech Adapter Playbook

Use when the user explicitly requests creation and the target tech adapter repository does not exist. That request authorizes repository scaffolding and independent Git initialization after the preflight succeeds; do not ask for a second confirmation unless setup of a missing workspace is required.

## Preflight

1. Confirm the language (`java` or `python`), safe repository name, and workspace path. Ask only for missing values.
2. Resolve the toolkit release associated with the installed skill source or Git tag. If it cannot be determined, ask the user; never use `latest` implicitly.
3. Verify that the selected CLI release exists and matches the skill release.
4. Verify that the workspace contains `.witboost-toolkit/manifest.json` and `tech-adapters/`.
5. Verify that `tech-adapters/<adapter-name>` does not exist.

If the workspace is not configured, propose this exact-version command and ask for approval before executing it:

```bash
npx @witboost/platform-team-ai-toolkit@<toolkit-release> setup --dir <workspace-dir>
```

Workspace setup is a separate mutation and is not implied by the request to create an adapter.

## Create

Run:

```bash
npx @witboost/platform-team-ai-toolkit@<toolkit-release> create tech-adapter <java|python> <adapter-name> --dir <workspace-dir>
```

Then verify:

- the repository exists under `tech-adapters/`;
- it has one independent initial Git commit;
- `docs/scaffold-provenance.json` records toolkit release, scaffold URL, and immutable scaffold commit;
- the language-specific structural check passes.

Return the [creation result](../../assets/creation-result.md). Continue to design or evolution only when the original request includes that work or the user asks for it. Do not assess an untouched scaffold merely to rediscover its known baseline.
