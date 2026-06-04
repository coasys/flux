#!/usr/bin/env bash
set -euo pipefail

# Detect branch (Netlify sets BRANCH / HEAD; GitHub Actions uses GITHUB_HEAD_REF / GITHUB_REF)
BRANCH="${BRANCH:-${HEAD:-${GITHUB_HEAD_REF:-${GITHUB_REF#refs/heads/}}}}"

# For Netlify deploy previews, branch is set to "pull/N/head" instead of the actual branch name
# Resolve the real branch name via the GitHub API
if echo "$BRANCH" | grep -qE '^pull/[0-9]+/head$'; then
  PR_NUM=$(echo "$BRANCH" | sed 's|pull/\([0-9]*\)/head|\1|')
  echo "==> PR deploy preview detected (PR #$PR_NUM), resolving branch name..."
  REAL_BRANCH=$(curl -sf "https://api.github.com/repos/coasys/flux/pulls/$PR_NUM" | python3 -c "import sys,json; print(json.load(sys.stdin)['head']['ref'])" 2>/dev/null || true)
  if [ -n "$REAL_BRANCH" ]; then
    BRANCH="$REAL_BRANCH"
  fi
fi

echo "==> Detected branch: $BRANCH"

# Resolve which AD4M branch to clone: matching branch if available, otherwise dev.
# Published @coasys/ad4m-* packages have broken workspace: refs and dev's package.json
# pins @coasys/ad4m to link:../ad4m/core, so a local ad4m clone is always required.
if git ls-remote --exit-code --heads \
  https://github.com/coasys/ad4m.git "$BRANCH" >/dev/null 2>&1; then
  AD4M_BRANCH="$BRANCH"
  echo "==> Found matching AD4M branch '$BRANCH'"
else
  AD4M_BRANCH="dev"
  echo "==> No matching AD4M branch — falling back to 'dev'"
fi

echo "==> Cloning AD4M branch '$AD4M_BRANCH'"
rm -rf ad4m
git clone --depth 1 --single-branch --branch "$AD4M_BRANCH" \
  https://github.com/coasys/ad4m.git ad4m

# Pin pnpm to v9 for AD4M build (ad4m uses object-format workspace overrides which pnpm v10 rejects)
npm i -g pnpm@9.15.0 2>/dev/null || true

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
echo "==> AD4M packages built"

echo "==> Overriding @coasys packages with local builds"
node -e "
  const pkg = require('./package.json');
  pkg.pnpm = pkg.pnpm || {};
  pkg.pnpm.overrides = pkg.pnpm.overrides || {};
  pkg.pnpm.overrides['@coasys/ad4m'] = 'file:./ad4m/core';
  pkg.pnpm.overrides['@coasys/ad4m-connect'] = 'file:./ad4m/connect';
  pkg.pnpm.overrides['@coasys/hooks-helpers'] = 'file:./ad4m/ad4m-hooks/helpers';
  pkg.pnpm.overrides['@coasys/ad4m-react-hooks'] = 'file:./ad4m/ad4m-hooks/react';
  pkg.pnpm.overrides['@coasys/ad4m-vue-hooks'] = 'file:./ad4m/ad4m-hooks/vue';
  require('fs').writeFileSync('./package.json', JSON.stringify(pkg, null, 2) + '\n');
"

pnpm install --no-frozen-lockfile

# Clear ALL build caches AND pre-built view bundles so everything rebuilds with the linked SDK
rm -rf app/node_modules/.vite .turbo node_modules/.cache
find . -name '.turbo' -type d -not -path './ad4m/*' -not -path './node_modules/*' -exec rm -rf {} + 2>/dev/null || true
find views -name 'dist' -type d -exec rm -rf {} + 2>/dev/null || true
find packages -name 'dist' -type d -exec rm -rf {} + 2>/dev/null || true
rm -rf app/dist
echo "==> All caches + dist directories cleared"

NODE_OPTIONS='--max-old-space-size=4096' pnpm build
