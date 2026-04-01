#!/usr/bin/env bash
set -euo pipefail

# Detect branch (Netlify sets BRANCH / HEAD; GitHub Actions uses GITHUB_HEAD_REF / GITHUB_REF)
BRANCH="${BRANCH:-${HEAD:-${GITHUB_HEAD_REF:-${GITHUB_REF#refs/heads/}}}}"
echo "==> Detected branch: $BRANCH"

# Check if coasys/ad4m has a matching branch (git ls-remote handles slashes natively)
if git ls-remote --exit-code --heads \
  https://github.com/coasys/ad4m.git "$BRANCH" >/dev/null 2>&1; then
  echo "==> Found matching AD4M branch '$BRANCH' — cloning and linking"

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
  [ -f ad4m-hooks/helpers/tsconfig.json ] && (cd ad4m-hooks/helpers && pnpm exec tsc && cd ../..) || echo "Skipping ad4m-hooks/helpers (no tsconfig.json)"
  [ -f ad4m-hooks/react/tsconfig.json ] && (cd ad4m-hooks/react && pnpm exec tsc && cd ../..) || echo "Skipping ad4m-hooks/react (no tsconfig.json)"
  [ -f ad4m-hooks/vue/tsconfig.json ] && (cd ad4m-hooks/vue && pnpm exec tsc && cd ../..) || echo "Skipping ad4m-hooks/vue (no tsconfig.json)"

  # Strip packageManager field so yarn link works (AD4M uses pnpm, Flux uses yarn)
  node -e "const p=require('./package.json'); delete p.packageManager; require('fs').writeFileSync('./package.json', JSON.stringify(p, null, 2)+'\n')"

  # Yarn link each package (using subshells to avoid cd chain issues)
  (cd core && yarn link)
  (cd connect && yarn link)
  [ -d ad4m-hooks/helpers/lib ] && (cd ad4m-hooks/helpers && yarn link) || true
  [ -d ad4m-hooks/react/lib ] && (cd ad4m-hooks/react && yarn link) || true
  [ -d ad4m-hooks/vue/lib ] && (cd ad4m-hooks/vue && yarn link) || true
  cd ..

  AD4M_LINKED=true
  echo "==> AD4M packages registered for linking"
else
  AD4M_LINKED=false
  echo "==> No matching AD4M branch — using published npm packages"
fi

# Install Flux dependencies first
yarn install --frozen-lockfile || yarn install

# Link AD4M packages AFTER install (install would overwrite links)
if [ "$AD4M_LINKED" = true ]; then
  yarn link @coasys/ad4m @coasys/ad4m-connect
  [ -d ad4m/ad4m-hooks/helpers/lib ] && yarn link @coasys/hooks-helpers || true
  [ -d ad4m/ad4m-hooks/react/lib ] && yarn link @coasys/ad4m-react-hooks || true
  [ -d ad4m/ad4m-hooks/vue/lib ] && yarn link @coasys/ad4m-vue-hooks || true
  rm -rf app/node_modules/.vite .turbo
  echo "==> AD4M packages linked successfully"
fi

NODE_OPTIONS='--max-old-space-size=4096' yarn build
