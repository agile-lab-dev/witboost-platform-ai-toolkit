# Witboost Tech Adapter AI Toolkit Repo

This repository hosts the dedicated agent and skill package for Witboost tech adapter development.

## Rules

- Treat Create and Assess as operations selected from repository state, never as permanent repository modes.
- Keep adapter repositories under `tech-adapters/` and template repositories under `templates/` in the configured workspace.
- Keep the distinction between the workspace root and each target asset repository explicit.
- Any change to lifecycle semantics must be reflected in both the references and the reusable templates.
- Do not collapse template responsibilities, descriptor responsibilities, and adapter responsibilities into one bucket.
- When changing the agent or skill frontmatter, run `make validate`.
