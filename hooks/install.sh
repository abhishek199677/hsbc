#!/bin/sh
#
# Install the pre-commit hook for secret scanning.
# Run: ./hooks/install.sh
#

HOOK_DIR="$(git rev-parse --git-dir)/hooks"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

cp "$SCRIPT_DIR/pre-commit" "$HOOK_DIR/pre-commit"
chmod +x "$HOOK_DIR/pre-commit"

echo " Pre-commit hook installed."
echo "   It will scan staged files for leaked secrets on every commit."
echo "   To bypass: git commit --no-verify"
