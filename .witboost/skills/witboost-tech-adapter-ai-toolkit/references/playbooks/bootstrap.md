# Bootstrap Playbook

Use for `new adapter` mode only.

1. Confirm Java or Python, the adapter name, and a target path: a new, empty
   or not-yet-existing directory, outside this workflow host repository and
   outside any repository the user is already standing in. Explain why: that
   path becomes the tech adapter's own independent git repository.
2. Run `scripts/bootstrap-new-adapter.sh <java|python> <target-path> <harness...>`
   from the root of this workflow host repository. The script clones the
   scaffold straight into the target path, copies `.witboost/`, generates
   the requested harness(es), and automatically runs `check-bootstrap.sh`
   to verify scaffold structure and harness files — report its pass/fail
   output verbatim. If it fails, the script exits non-zero and the
   bootstrap is not done yet. This automatic run skips the git-state
   section: right after the script's own commit, in the same process, the
   repository can only be untouched, so checking that here would add
   nothing.
3. Record the result with the [new adapter brief](../../assets/new-adapter-brief.md).
4. Tell the user explicitly to open the target path as its own workspace or
   window before continuing — this chat session stays scoped to the workflow
   host and has no way to keep operating against the new repository.
5. The repository is untouched by construction at this point, unless the
   user made changes of their own between the bootstrap and opening the new
   session — ask rather than assuming either way from silence.
6. If it's still untouched (the default), skip the
   [attach report](../../assets/attach-report.md) — that outcome is already
   known from the scaffold itself. The target repo already has its own
   dedicated agents generated: point the user at "Witboost Adapter
   High-Level Design" (recommended first) or "Witboost Adapter New Feature"
   directly instead of re-invoking this generic toolkit agent, when their
   tool supports per-repo agent pickers.
7. If the user says they made changes before opening the new session, run
   `check-bootstrap.sh <java|python> <harness...>` (without `SKIP_GIT_STATE`)
   to confirm, then hand off to the [Attach playbook](./attach.md) for full
   reconstruction if it reports diverged — point the user at "Witboost
   Adapter Attach" directly when their tool supports per-repo agent
   pickers. Otherwise, ask the user what capability to design or implement
   first, recommending the [High-Level Design playbook](./high-level-design.md)
   first when `docs/HLD.md` does not exist yet.