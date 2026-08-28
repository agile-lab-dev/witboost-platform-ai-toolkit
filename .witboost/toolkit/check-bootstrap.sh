#!/usr/bin/env bash
# .witboost/toolkit/check-bootstrap.sh
#
# Deterministic structural check for `new adapter` mode, run inside the
# freshly bootstrapped TARGET repository (not this workflow host repo).
#
# This exists so confirming "is the scaffold structure present, is this
# still the untouched scaffold, are the requested harness files there" is
# one reproducible command instead of an agent re-deriving it by reading
# files by hand each session — the same reasoning that made
# scripts/bootstrap-new-adapter.sh a script instead of hand-run git steps.
#
# Usage (run from the target repo root):
#   bash .witboost/toolkit/check-bootstrap.sh <java|python> <harness...>
#
# Example:
#   bash .witboost/toolkit/check-bootstrap.sh python copilot
#
# Set SKIP_GIT_STATE=1 to skip the git-state section below. Only meaningful
# right after scripts/bootstrap-new-adapter.sh's own commit, in the same
# process — at that point the tree is guaranteed clean and this is the only
# commit, so the check can never report anything but untouched; it adds
# nothing there. A later, separate invocation (e.g. re-confirming state in a
# fresh session) should NOT set this — that's the one case where the
# repository's git state can genuinely have changed.

set -uo pipefail

LANGUAGE="${1:-}"
if [[ $# -gt 1 ]]; then
  shift 1
  HARNESSES=("$@")
else
  HARNESSES=()
fi

if [[ -z "$LANGUAGE" || ( "$LANGUAGE" != "java" && "$LANGUAGE" != "python" ) || ${#HARNESSES[@]} -eq 0 ]]; then
  echo "Usage: $0 <java|python> <harness...>" >&2
  exit 1
fi

REPO_ROOT="$(pwd)"
PASS=0
FAIL=0

check() {
  local label="$1"
  local status="$2"
  if [[ "$status" -eq 0 ]]; then
    echo "  PASS  $label"
    PASS=$((PASS + 1))
  else
    echo "  FAIL  $label"
    FAIL=$((FAIL + 1))
  fi
}

echo "Scaffold structure ($LANGUAGE):"
case "$LANGUAGE" in
  java)
    [[ -f "$REPO_ROOT/pom.xml" ]]; check "pom.xml present" $?
    [[ -d "$REPO_ROOT/common" ]]; check "common/ present" $?
    ;;
  python)
    [[ -f "$REPO_ROOT/tech-adapter/pyproject.toml" ]]; check "tech-adapter/pyproject.toml present" $?
    [[ -d "$REPO_ROOT/tech-adapter" ]]; check "tech-adapter/ present" $?
    ;;
esac

[[ -f "$REPO_ROOT/.witboost/toolkit/package.json" ]]; check ".witboost/ copied" $?

UNTOUCHED=1
if [[ "${SKIP_GIT_STATE:-0}" != "1" ]]; then
  echo
  echo "Git state:"
  COMMIT_COUNT="$(git -C "$REPO_ROOT" rev-list --count HEAD 2>/dev/null || echo -1)"
  LAST_MSG="$(git -C "$REPO_ROOT" log -1 --format=%s 2>/dev/null || echo "")"
  DIRTY="$(git -C "$REPO_ROOT" status --porcelain 2>/dev/null || echo "?")"
  if [[ "$COMMIT_COUNT" == "1" && "$LAST_MSG" == "Bootstrap tech adapter from $LANGUAGE scaffold" && -z "$DIRTY" ]]; then
    echo "  UNTOUCHED  still the untouched scaffold (1 commit, clean working tree)"
    UNTOUCHED=0
  else
    echo "  CHANGED    repository has diverged from the untouched scaffold (commits: $COMMIT_COUNT)"
  fi
fi

echo
echo "Harness files:"
for h in "${HARNESSES[@]}"; do
    case "$h" in
      copilot)
        compgen -G "$REPO_ROOT/.github/agents/"*.agent.md > /dev/null; check "copilot: .github/agents/*.agent.md" $?
        [[ -d "$REPO_ROOT/.github/skills" ]]; check "copilot: .github/skills/" $?
        ;;
      claude)
        [[ -f "$REPO_ROOT/CLAUDE.md" ]]; check "claude: CLAUDE.md" $?
        [[ -d "$REPO_ROOT/.claude/skills" ]]; check "claude: .claude/skills/" $?
        ;;
      gemini)
        [[ -f "$REPO_ROOT/GEMINI.md" ]]; check "gemini: GEMINI.md" $?
        compgen -G "$REPO_ROOT/.gemini/instructions/"*.md > /dev/null; check "gemini: .gemini/instructions/*.md" $?
        ;;
      codex)
        [[ -f "$REPO_ROOT/AGENTS.md" ]]; check "codex: AGENTS.md" $?
        ;;
      *)
        echo "  FAIL  unknown harness '$h'"
        FAIL=$((FAIL + 1))
        ;;
    esac
done

echo
echo "$PASS passed, $FAIL failed."
if [[ "${SKIP_GIT_STATE:-0}" == "1" ]]; then
  echo "Git state check skipped: guaranteed untouched immediately after bootstrap."
elif [[ $UNTOUCHED -eq 0 ]]; then
  echo "Still the untouched scaffold: skip attach-report.md, structure confirmed above."
else
  echo "Repository has diverged from the scaffold: continue with the attach playbook (attach-report.md)."
fi

exit "$FAIL"
