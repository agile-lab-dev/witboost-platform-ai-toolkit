#!/usr/bin/env bash

set -euo pipefail

USAGE="Usage: $0 <java|python> <workspace-dir> <adapter-name>"
LANGUAGE="${1:-}"
WORKSPACE_DIR="${2:-}"
ADAPTER_NAME="${3:-}"

if [[ -z "$LANGUAGE" || -z "$WORKSPACE_DIR" || -z "$ADAPTER_NAME" || $# -ne 3 ]]; then
  echo "$USAGE" >&2
  exit 1
fi

case "$LANGUAGE" in
  java) SCAFFOLD_URL="https://github.com/agile-lab-dev/witboost-java-scaffold.git" ;;
  python) SCAFFOLD_URL="https://github.com/agile-lab-dev/witboost-python-scaffold.git" ;;
  *)
    echo "Unknown language '$LANGUAGE'. Expected 'java' or 'python'." >&2
    exit 1
    ;;
esac

if [[ "$ADAPTER_NAME" == */* || "$ADAPTER_NAME" == "." || "$ADAPTER_NAME" == ".." ]]; then
  echo "Adapter name must be a single directory name." >&2
  exit 1
fi

TECH_ADAPTERS_DIR="${WORKSPACE_DIR%/}/tech-adapters"
TARGET_PATH="$TECH_ADAPTERS_DIR/$ADAPTER_NAME"

if [[ ! -d "$TECH_ADAPTERS_DIR" ]]; then
  echo "'$WORKSPACE_DIR' is not a configured Witboost workspace: missing tech-adapters/." >&2
  exit 1
fi

if [[ -e "$TARGET_PATH" ]]; then
  echo "Target '$TARGET_PATH' already exists. Aborting." >&2
  exit 1
fi

cleanup_failed_creation() {
  local status=$?
  if [[ $status -ne 0 && -d "$TARGET_PATH" ]]; then
    rm -rf "${TARGET_PATH:?}"
  fi
  exit "$status"
}
trap cleanup_failed_creation EXIT

echo "Cloning $SCAFFOLD_URL into $TARGET_PATH ..."
git clone --depth 1 "$SCAFFOLD_URL" "$TARGET_PATH"

case "$LANGUAGE" in
  java)
    [[ -f "$TARGET_PATH/pom.xml" && -d "$TARGET_PATH/common" ]]
    ;;
  python)
    [[ -f "$TARGET_PATH/tech-adapter/pyproject.toml" ]]
    ;;
esac
echo "Scaffold structure verified."

echo "Starting independent git history ..."
rm -rf "${TARGET_PATH:?}/.git"
git -C "$TARGET_PATH" init -q
git -C "$TARGET_PATH" add -A
git -C "$TARGET_PATH" commit -q -m "Create tech adapter from $LANGUAGE scaffold"

echo "Created $LANGUAGE tech adapter at: $TARGET_PATH"