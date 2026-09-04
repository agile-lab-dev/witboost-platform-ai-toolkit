# Review Playbook

1. Establish the actual contract and the intended change or baseline.
2. Read `docs/decisions/DECISIONS.md` and the relevant topic `Review Signals` sections.
3. Compare implementation, API contract, deployment configuration, docs, and tests.
4. Report findings first, ordered by behavioral severity and grounded in target-repository evidence.
5. Then report missing decisions, missing tests, compatibility risks, and open questions.
6. Keep the review read-only. If implementation and HLD disagree, ask the user which contract is intended; only an accepted architectural resolution updates both HLD and the decision log.

Prioritize incorrect lifecycle or ownership behavior, unsafe security behavior, irrecoverable state, and silent deployment mismatch over style or documentation gaps.
