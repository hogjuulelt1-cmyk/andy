#!/bin/bash
# SessionStart hook for Claude Code cloud sessions: installs dependencies for
# travel-bnpl/. Wire it from the repo-root .claude/settings.json as
#   "$CLAUDE_PROJECT_DIR/travel-bnpl/.claude/hooks/session-start.sh"
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

# Resolve the app folder from this script's location, whatever the project root is.
cd "$(dirname "$0")/../.."

# Nothing to install until the app is scaffolded (roadmap M0).
if [ ! -f package.json ]; then
  echo "No package.json yet; skipping dependency install."
  exit 0
fi

# Playwright: use the preinstalled Chromium.
echo 'export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1' >> "${CLAUDE_ENV_FILE:-/dev/null}"
export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

if [ -f pnpm-lock.yaml ] || grep -q '"packageManager": *"pnpm' package.json; then
  command -v pnpm >/dev/null 2>&1 || corepack enable >/dev/null 2>&1 || npm install -g pnpm
  pnpm install --frozen-lockfile
else
  npm install
fi

if [ -f prisma/schema.prisma ]; then
  pnpm exec prisma generate
fi
