# New Adapter Brief

## Goal

Bootstrap a new tech adapter repository from the matching Witboost scaffold.
See the [bootstrap playbook](../references/playbooks/bootstrap.md) for the
exact commands.

## Bootstrap

- Language: Java or Python
- Scaffold repository used
- Target repository path
- Git history stripped: yes/no
- `.witboost/` copied and setup CLI run for harness(es):
- Bootstrap check (run automatically by the script): pass/fail

## Next Step

The bootstrap script's automatic `check-bootstrap.sh` run skips the
git-state check — right after its own commit, in the same process, the
repository can only be untouched, so it only verifies scaffold structure
and harness files. The repository is untouched by construction unless the
user made their own changes before opening this session; ask rather than
assuming either way from silence.

If it's still untouched (the default case), skip
[attach-report.md](./attach-report.md) — its outcome is already known from
the scaffold itself. The target repo already has its own dedicated agents
generated: point the user at "Witboost Adapter High-Level Design"
(recommended first, skippable) or "Witboost Adapter New Feature" directly
instead of re-invoking this generic toolkit agent, when their tool supports
per-repo agent pickers.

If the user made changes before opening this session, run
`check-bootstrap.sh <java|python> <harness...>` (without `SKIP_GIT_STATE`)
to confirm whether it has diverged, then continue with
[attach-report.md](./attach-report.md) instead (see below), or point the
user at "Witboost Adapter Attach" directly when their tool supports
per-repo agent pickers.

Once the repository has real custom code beyond the scaffold (this session
or a later one), continue with [attach-report.md](./attach-report.md)
against it — the rest of the workflow (contract reconstruction, lifecycle
mapping, decisions, review, implementation, and testing) is identical to
`attach existing adapter` mode.
