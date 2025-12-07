#!/bin/bash

# Script to install Git hooks for the Prashiskshan backend

echo "📦 Installing Git hooks..."

# Get the root directory of the git repository
GIT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null)

if [ -z "$GIT_ROOT" ]; then
    echo "❌ Error: Not in a Git repository"
    exit 1
fi

HOOKS_DIR="$GIT_ROOT/.git/hooks"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Create hooks directory if it doesn't exist
mkdir -p "$HOOKS_DIR"

# Install pre-commit hook
echo "Installing pre-commit hook..."
cp "$SCRIPT_DIR/pre-commit-hook.sh" "$HOOKS_DIR/pre-commit"
chmod +x "$HOOKS_DIR/pre-commit"

if [ -f "$HOOKS_DIR/pre-commit" ]; then
    echo "✅ Pre-commit hook installed successfully"
else
    echo "❌ Failed to install pre-commit hook"
    exit 1
fi

echo ""
echo "🎉 Git hooks installed!"
echo ""
echo "The pre-commit hook will:"
echo "  • Validate OpenAPI spec structure"
echo "  • Check schema examples match schemas"
echo "  • Verify all routes are documented"
echo ""
echo "To bypass the hook (not recommended):"
echo "  git commit --no-verify"

exit 0
