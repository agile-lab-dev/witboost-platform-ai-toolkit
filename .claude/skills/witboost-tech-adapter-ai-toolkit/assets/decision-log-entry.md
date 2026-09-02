# Decision Log Entry

Append one dated entry to `docs/decisions/DECISIONS.md` in the target adapter repository. Do not rewrite prior entries. When a decision changes, identify the superseded entry and explain compatibility or migration effects.

Persist this entry at the end of every assessment, new feature, review, or customize session, even when some topics remain unresolved. An entry that mixes locked and explicitly open topics is the expected, valid closing deliverable — never withhold the whole file because some questions are still open. Give every topic a status so nothing is silently dropped, and let a later session append a follow-up entry without reconstructing the contract from scratch.

## YYYY-MM-DD — Decision Title

- Status: locked | partially locked | open | supersedes YYYY-MM-DD entry
- Scope:
- Evidence:
- Open follow-ups: list each topic still open below and what would resolve it, so the next session can pick up directly.

| Topic | Status | Decision | Evidence In Repo | Open Risk |
| --- | --- | --- | --- | --- |
| Repository mode | locked/open |  |  |  |
| Workflow host repo | locked/open |  |  |  |
| Target adapter repo | locked/open |  |  |  |
| Related template repo | locked/open |  |  |  |
| Descriptor source | locked/open |  |  |  |
| Naming and resource identity | locked/open |  |  |  |
| Workload release and artifact integrity | locked/open |  |  |  |
| Descriptor and adapter configuration ownership | locked/open |  |  |  |
| Execution and durable task model | locked/open |  |  |  |
| ACL scaffolding, managed grants, and protected grants | locked/open |  |  |  |
| Idempotency, retries, and partial-failure recovery | locked/open |  |  |  |
| Admin and Witboost observability, correlation, and redaction | locked/open |  |  |  |

For any row marked `open`, fill Decision with the leading hypothesis (if any) and use Open Risk to state what evidence or choice would lock it — do not leave the row blank just because it is unresolved.