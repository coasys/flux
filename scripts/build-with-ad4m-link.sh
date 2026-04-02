#!/usr/bin/env bash
set -euo pipefail

# Detect branch (Netlify sets BRANCH / HEAD; GitHub Actions uses GITHUB_HEAD_REF / GITHUB_REF)
BRANCH="${BRANCH:-${HEAD:-${GITHUB_HEAD_REF:-${GITHUB_REF#refs/heads/}}}}"

# Netlify PR deploy previews set branch to "pull/N/head" instead of the actual branch name.
# Resolve the real branch name via the GitHub API.
if echo "$BRANCH" | grep -qE '^pull/[0-9]+/head$'; then
  PR_NUM=$(echo "$BRANCH" | sed 's|pull/\([0-9]*\)/head|\1|')
  echo "==> PR deploy preview detected (PR #$PR_NUM), resolving branch name..."
  REAL_BRANCH=$(curl -sf "https://api.github.com/repos/coasys/flux/pulls/$PR_NUM" | python3 -c "import sys,json; print(json.load(sys.stdin)['head']['ref'])" 2>/dev/null || true)
  if [ -n "$REAL_BRANCH" ]; then
    BRANCH="$REAL_BRANCH"
  fi
fi

echo "==> Detected branch: $BRANCH"

# Check if coasys/ad4m has a matching branch
if git ls-remote --exit-code --heads \
  https://github.com/coasys/ad4m.git "$BRANCH" >/dev/null 2>&1; then
  echo "==> Found matching AD4M branch '$BRANCH' — cloning and building"

  git clone --depth 1 --single-branch --branch "$BRANCH" \
    https://github.com/coasys/ad4m.git ad4m

  npm i -g pnpm

  cd ad4m
  pnpm install --no-frozen-lockfile

  echo "==> Building @coasys/ad4m (core)"
  cd core && pnpm exec tsc && pnpm run bundle && cd ..

  echo "==> Building @coasys/ad4m-connect"
  cd connect && pnpm run build && cd ..

  echo "==> Building hooks (if tsconfig.json exists)"
  [ -f ad4m-hooks/helpers/tsconfig.json ] && (cd ad4m-hooks/helpers && pnpm exec tsc) || echo "Skipping ad4m-hooks/helpers"
  [ -f ad4m-hooks/react/tsconfig.json ] && (cd ad4m-hooks/react && pnpm exec tsc) || echo "Skipping ad4m-hooks/react"
  [ -f ad4m-hooks/vue/tsconfig.json ] && (cd ad4m-hooks/vue && pnpm exec tsc) || echo "Skipping ad4m-hooks/vue"

  cd ..
  AD4M_LINKED=true
  echo "==> AD4M build complete"
else
  AD4M_LINKED=false
  echo "==> No matching AD4M branch — using published npm packages"
fi

# Install Flux dependencies
yarn install --frozen-lockfile || yarn install

# Replace ALL copies of @coasys/ad4m with the branch-built version
if [ "$AD4M_LINKED" = true ]; then
  echo "==> Replacing @coasys/ad4m in all node_modules locations"

  AD4M_CORE_SRC="$(pwd)/ad4m/core"
  AD4M_CONNECT_SRC="$(pwd)/ad4m/connect"

  # Replace every instance (root + workspace-local, directories + symlinks)
  find . -path '*/node_modules/@coasys/ad4m' \( -type d -o -type l \) ! -path './ad4m/*' | while read -r target; do
    echo "  Replacing $target"
    rm -rf "$target"
    cp -R "$AD4M_CORE_SRC" "$target"
  done

  find . -path '*/node_modules/@coasys/ad4m-connect' \( -type d -o -type l \) ! -path './ad4m/*' | while read -r target; do
    echo "  Replacing $target"
    rm -rf "$target"
    cp -R "$AD4M_CONNECT_SRC" "$target"
  done

  # Clear all build caches
  find . -name '.turbo' -type d ! -path './ad4m/*' -exec rm -rf {} + 2>/dev/null || true
  find . -path '*/node_modules/.vite' -type d ! -path './ad4m/*' -exec rm -rf {} + 2>/dev/null || true
  find . -path '*/node_modules/.cache' -type d ! -path './ad4m/*' -exec rm -rf {} + 2>/dev/null || true

  echo "==> AD4M packages replaced"
fi

NODE_OPTIONS='--max-old-space-size=4096' yarn build
