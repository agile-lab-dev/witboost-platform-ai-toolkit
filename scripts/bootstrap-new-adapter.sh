#!/usr/bin/env bash
# scripts/bootstrap-new-adapter.sh
#
# Bootstraps a brand-new tech adapter repository from the official Witboost
# scaffold: clones it, strips the scaffold's own git history, and initializes
# an independent one. By default that's the whole job — the target repo is
# assumed to live inside (or be opened as part of) an already-installed
# shared Witboost workspace (see README → Install the Toolkit Once), so
# Claude Code/Gemini CLI pick up agents/skills automatically and Copilot is
# already wired via the shared workspace's own .vscode/settings.json. No
# per-repo copy of `.witboost/` or harness generation is needed for those.
#
# Pass --standalone <harness...> to additionally copy this toolkit's
# canonical .witboost/ into the target and generate the requested harness
# file(s) there, for the rare case of a detached repo that must keep working
# on its own without the shared workspace present (e.g. handed to someone
# who hasn't set it up, or cloned in isolation).
#
# This exists so `new adapter` bootstrap is one deterministic command instead
# of hand-run git steps, which are easy to get wrong (e.g. cloning into the
# wrong directory, or deleting a .git that isn't the one you meant).
#
# Usage:
#   scripts/bootstrap-new-adapter.sh <java|python> <target-path> [--standalone <harness...>]
#
# Examples:
#   scripts/bootstrap-new-adapter.sh java ~/witboost/tech-adapters/witboost-my-new-tech-adapter
#   scripts/bootstrap-new-adapter.sh java ../witboost-my-new-tech-adapter --standalone copilot

set -euo pipefail

USAGE="Usage: $0 <java|python> <target-path> [--standalone <harness...>]"

LANGUAGE="${1:-}"
TARGET_PATH="${2:-}"
STANDALONE=0
HARNESSES=()

if [[ $# -gt 2 ]]; then
  if [[ "${3:-}" != "--standalone" ]]; then
    echo "$USAGE" >&2
    exit 1
  fi
  STANDALONE=1
  shift 3
  HARNESSES=("$@")
  if [[ ${#HARNESSES[@]} -eq 0 ]]; then
    echo "--standalone requires at least one harness." >&2
    exit 1
  fi
fi

if [[ -z "$LANGUAGE" || -z "$TARGET_PATH" ]]; then
  echo "$USAGE" >&2
  exit 1
fi

JAVA_SCAFFOLD="https://github.com/agile-lab-dev/witboost-java-scaffold.git"
PYTHON_SCAFFOLD="https://github.com/agile-lab-dev/witboost-python-scaffold.git"

case "$LANGUAGE" in
  java) SCAFFOLD_URL="$JAVA_SCAFFOLD" ;;
  python) SCAFFOLD_URL="$PYTHON_SCAFFOLD" ;;
  *)
    echo "Unknown language '$LANGUAGE'. Expected 'java' or 'python'." >&2
    exit 1
    ;;
esac

if [[ $STANDALONE -eq 1 ]]; then
  # Validated up front, before any cloning/writing, so an invalid harness
  # never leaves a half-bootstrapped target repo behind (must match
  # GENERATORS keys in .witboost/toolkit/src/setup/index.ts).
  VALID_HARNESSES=(copilot claude codex gemini)
  for h in "${HARNESSES[@]}"; do
    match=0
    for vh in "${VALID_HARNESSES[@]}"; do
      [[ "$h" == "$vh" ]] && match=1 && break
    done
    if [[ $match -eq 0 ]]; then
      echo "Unknown harness '$h'. Expected one of: ${VALID_HARNESSES[*]}." >&2
      exit 1
    fi
  done
fi

HOST_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [[ $STANDALONE -eq 1 ]] && [[ ! -f "$HOST_ROOT/.witboost/toolkit/setup.cjs" ]]; then
  echo "Missing $HOST_ROOT/.witboost/toolkit/setup.cjs — run 'npm run build' (or 'make build') in this toolkit repo first." >&2
  exit 1
fi

case "$TARGET_PATH" in
  "$HOST_ROOT"|"$HOST_ROOT"/*)
    echo "Target path must be outside this toolkit repository ($HOST_ROOT)." >&2
    exit 1
    ;;
esac

if [[ -e "$TARGET_PATH" ]] && [[ -n "$(ls -A "$TARGET_PATH" 2>/dev/null)" ]]; then
  echo "Target path '$TARGET_PATH' already exists and is not empty. Aborting." >&2
  exit 1
fi

echo "Cloning $SCAFFOLD_URL into $TARGET_PATH ..."
git clone --depth 1 "$SCAFFOLD_URL" "$TARGET_PATH"

echo "Stripping scaffold git history and starting an independent one ..."
rm -rf "${TARGET_PATH:?}/.git"
git -C "$TARGET_PATH" init -q

if [[ $STANDALONE -eq 1 ]]; then
  echo "Copying .witboost/ into the new repository (--standalone) ..."
  cp -r "$HOST_ROOT/.witboost" "$TARGET_PATH/.witboost"

  for h in "${HARNESSES[@]}"; do
    echo "Generating '$h' harness files in the new repository ..."
    (cd "$TARGET_PATH" && node .witboost/toolkit/setup.cjs --harness "$h")
  done
else
  echo "Skipping local harness generation — relying on the shared Witboost workspace install (see README)."
fi

# Committed after .witboost/ and harness files (if any) are in place so the
# working tree is clean here and check-bootstrap.sh can detect an untouched
# scaffold.
git -C "$TARGET_PATH" add -A
git -C "$TARGET_PATH" commit -q -m "Bootstrap tech adapter from $LANGUAGE scaffold"

echo "Running bootstrap check ..."
CHECK_STATUS=0
# Git-state is skipped here: this script's own commit just ran, in this same
# process, so the tree is guaranteed clean and it's the only commit — the
# check could never report anything but untouched. See check-bootstrap.sh.
if [[ $STANDALONE -eq 1 ]]; then
  (cd "$TARGET_PATH" && SKIP_GIT_STATE=1 bash .witboost/toolkit/check-bootstrap.sh "$LANGUAGE" --standalone "${HARNESSES[@]}") || CHECK_STATUS=$?
else
  # No .witboost/ copy exists in the target, so the check is run against the
  # host repo's own copy instead — it only needs $TARGET_PATH as cwd to
  # verify scaffold structure and git state.
  (cd "$TARGET_PATH" && SKIP_GIT_STATE=1 bash "$HOST_ROOT/.witboost/toolkit/check-bootstrap.sh" "$LANGUAGE") || CHECK_STATUS=$?
fi

if [[ $CHECK_STATUS -ne 0 ]]; then
  echo
  echo "✗ Bootstrap check reported failures at: $TARGET_PATH (see above)." >&2
  exit "$CHECK_STATUS"
fi

cat <<EOF

✓ Bootstrapped $LANGUAGE tech adapter at: $TARGET_PATH

Next step: open $TARGET_PATH as its own workspace/window — it's the
untouched scaffold at this point (structure verified above), so continue
there directly instead of repeating a generic "continue bootstrap" prompt:
use the "Witboost Adapter High-Level Design" agent (recommended first) or
"Witboost Adapter New Feature" (or say "Let's define the high-level design
for this adapter.").
EOF
