#!/usr/bin/env bash
# scripts/bootstrap-new-adapter.sh
#
# Bootstraps a brand-new tech adapter repository from the official Witboost
# scaffold, strips the scaffold's own git history, initializes an independent
# one, copies this toolkit's canonical .witboost/ folder into it, generates
# the requested harness(es), and runs check-bootstrap.sh to verify the result
# — one command instead of running bootstrap and its verification separately.
#
# This exists so `new adapter` bootstrap is one deterministic command instead
# of hand-run git steps, which are easy to get wrong (e.g. cloning into the
# wrong directory, or deleting a .git that isn't the one you meant).
#
# Prerequisites: this toolkit must be built first (`npm run build` / `make
# build`), so .witboost/toolkit/setup.cjs exists to copy over.
#
# Usage:
#   scripts/bootstrap-new-adapter.sh <java|python> <target-path> <harness...>
#
# Example:
#   scripts/bootstrap-new-adapter.sh java ../witboost-my-new-tech-adapter copilot

set -euo pipefail

LANGUAGE="${1:-}"
TARGET_PATH="${2:-}"
if [[ $# -gt 2 ]]; then
  shift 2
  HARNESSES=("$@")
else
  HARNESSES=()
fi

JAVA_SCAFFOLD="https://github.com/agile-lab-dev/witboost-java-scaffold.git"
PYTHON_SCAFFOLD="https://github.com/agile-lab-dev/witboost-python-scaffold.git"

if [[ -z "$LANGUAGE" || -z "$TARGET_PATH" || ${#HARNESSES[@]} -eq 0 ]]; then
  echo "Usage: $0 <java|python> <target-path> <harness...>" >&2
  exit 1
fi

case "$LANGUAGE" in
  java) SCAFFOLD_URL="$JAVA_SCAFFOLD" ;;
  python) SCAFFOLD_URL="$PYTHON_SCAFFOLD" ;;
  *)
    echo "Unknown language '$LANGUAGE'. Expected 'java' or 'python'." >&2
    exit 1
    ;;
esac

# Validated up front, before any cloning/writing, so an invalid harness never
# leaves a half-bootstrapped target repo behind (must match GENERATORS keys
# in .witboost/toolkit/src/setup/index.ts).
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

HOST_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [[ ! -f "$HOST_ROOT/.witboost/toolkit/setup.cjs" ]]; then
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

echo "Copying .witboost/ into the new repository ..."
cp -r "$HOST_ROOT/.witboost" "$TARGET_PATH/.witboost"

for h in "${HARNESSES[@]}"; do
  echo "Generating '$h' harness files in the new repository ..."
  (cd "$TARGET_PATH" && node .witboost/toolkit/setup.cjs --harness "$h")
done

# Committed after .witboost/ and harness files are in place so the working
# tree is clean here and check-bootstrap.sh can detect an untouched scaffold.
git -C "$TARGET_PATH" add -A
git -C "$TARGET_PATH" commit -q -m "Bootstrap tech adapter from $LANGUAGE scaffold"

echo "Running bootstrap check ..."
CHECK_STATUS=0
# Git-state is skipped here: this script's own commit just ran, in this same
# process, so the tree is guaranteed clean and it's the only commit — the
# check could never report anything but untouched. See check-bootstrap.sh.
(cd "$TARGET_PATH" && SKIP_GIT_STATE=1 bash .witboost/toolkit/check-bootstrap.sh "$LANGUAGE" "${HARNESSES[@]}") || CHECK_STATUS=$?

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
