# Create Tech Adapter Playbook

Use when the requested tech adapter repository does not exist.

1. Confirm Java or Python and a single repository name.
2. From the configured workspace root, run `scripts/create-tech-adapter.sh <java|python> "$PWD" <adapter-name>`.
3. Confirm that the repository was created under `tech-adapters/` with independent Git history.
4. Record the [creation result](../../assets/creation-result.md).
5. Continue with High-Level Design (recommended) or New Feature. Do not assess an untouched scaffold: its baseline is already known.