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

  rm -rf ad4m
  if ! git clone --depth 1 --single-branch --branch "$BRANCH" \
    https://github.com/coasys/ad4m.git ad4m; then
    echo "⚠️  AD4M clone failed, will use published packages instead"
    AD4M_LINKED=false
  elif ! (
    # Force pnpm v9 (v10 breaks ad4m workspace with "overrides.core: { hoist: false }" format)
    npm install -g pnpm@9.15.0 || npm i -g pnpm@9.15.0 || corepack prepare pnpm@9.15.0 --activate || echo "Warning: pnpm v9 pin may not have applied"
    pnpm --version

    cd ad4m
    pnpm install --no-frozen-lockfile && \
    cd core && pnpm exec tsc && pnpm run bundle && cd .. && \
    cd connect && pnpm run build && cd ..
  ); then
    echo "⚠️  AD4M build failed, will use published packages instead"
    cd ..
    rm -rf ad4m
    AD4M_LINKED=false
  else
    cd ad4m
    echo "==> Building hooks (if tsconfig.json exists)"
    [ -f ad4m-hooks/helpers/tsconfig.json ] && (cd ad4m-hooks/helpers && pnpm exec tsc) || echo "Skipping ad4m-hooks/helpers"
    [ -f ad4m-hooks/react/tsconfig.json ] && (cd ad4m-hooks/react && pnpm exec tsc) || echo "Skipping ad4m-hooks/react"
    [ -f ad4m-hooks/vue/tsconfig.json ] && (cd ad4m-hooks/vue && pnpm exec tsc) || echo "Skipping ad4m-hooks/vue"

    # Skip global link registration — will use direct pnpm link after install
    cd ..

    AD4M_LINKED=true
    echo "==> AD4M packages built successfully"
  fi
else
  AD4M_LINKED=false
  echo "==> No matching AD4M branch — using published npm packages"
fi

# Install Flux dependencies
# If AD4M was linked, override the pnpm overrides to use the local build
if [ "$AD4M_LINKED" = true ]; then
  echo "==> Overriding @coasys/ad4m and @coasys/ad4m-connect with local builds"
  node -e "
    const pkg = require('./package.json');
    pkg.pnpm = pkg.pnpm || {};
    pkg.pnpm.overrides = pkg.pnpm.overrides || {};
    pkg.pnpm.overrides['@coasys/ad4m'] = 'file:./ad4m/core';
    pkg.pnpm.overrides['@coasys/ad4m-connect'] = 'file:./ad4m/connect';
    require('fs').writeFileSync('./package.json', JSON.stringify(pkg, null, 2) + '\n');
  "
fi
pnpm install --no-frozen-lockfile 2>&1 | tail -5

if [ "$AD4M_LINKED" = true ]; then
  # Clear ALL build caches AND pre-built view bundles so everything rebuilds with the linked SDK
  rm -rf app/node_modules/.vite .turbo node_modules/.cache
  find . -name '.turbo' -type d -not -path './ad4m/*' -not -path './node_modules/*' -exec rm -rf {} + 2>/dev/null || true
  find views -name 'dist' -type d -exec rm -rf {} + 2>/dev/null || true
  find packages -name 'dist' -type d -exec rm -rf {} + 2>/dev/null || true
  rm -rf app/dist
  echo "==> All caches + dist directories cleared"
fi

NODE_OPTIONS='--max-old-space-size=4096' pnpm build
