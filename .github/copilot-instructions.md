# Witboost Tech Adapter AI Toolkit Repo

This repository hosts the dedicated agent and skill package for Witboost tech adapter development.

## Rules

- Keep the distinction between `new adapter` and `attach existing adapter` explicit.
- Keep the distinction between workflow host repository and target adapter repository explicit.
- Any change to lifecycle semantics must be reflected in both the references and the reusable templates.
- Do not collapse template responsibilities, descriptor responsibilities, and adapter responsibilities into one bucket.
- When changing the agent or skill frontmatter, run `make validate`.
