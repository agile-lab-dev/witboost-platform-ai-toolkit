# Implementation Playbook

1. Confirm the target repository, desired behavior, and relevant locked decisions.
2. Identify the code path that directly controls the behavior and one focused check that can falsify the proposed change.
3. Make the smallest viable edit consistent with the target repository's patterns.
4. Run the focused check immediately after the first substantive edit.
5. Repair local failures and rerun the same check before widening scope.
6. Update API contracts, docs, deployment configuration, decision records, and tests only where the behavior requires them.
7. Finish with executable validation and report target-environment gaps.