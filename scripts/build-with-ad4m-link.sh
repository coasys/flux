#!/usr/bin/env bash
set -euo pipefail

# Detect branch (Netlify sets BRANCH / HEAD; GitHub Actions uses GITHUB_HEAD_REF / GITHUB_REF)
BRANCH="${BRANCH:-${HEAD:-${GITHUB_HEAD_REF:-${GITHUB_REF#refs/heads/}}}}"
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
  
  # Find and replace EVERY instance of @coasys/ad4m in node_modules
  find . -path '*/node_modules/@coasys/ad4m' -type d ! -path './ad4m/*' | while read -r target; do
    echo "  Replacing $target"
    rm -rf "$target"
    cp -R "$AD4M_CORE_SRC" "$target"
  done
  
  # Same for @coasys/ad4m-connect
  find . -path '*/node_modules/@coasys/ad4m-connect' -type d ! -path './ad4m/*' | while read -r target; do
    echo "  Replacing $target"
    rm -rf "$target"
    cp -R "$AD4M_CONNECT_SRC" "$target"
  done
  
  # Clear caches
  rm -rf app/node_modules/.vite .turbo node_modules/.cache
  echo "==> AD4M packages replaced in $(find . -path '*/node_modules/@coasys/ad4m' ! -path './ad4m/*' | wc -l | tr -d ' ') locations"
fi

NODE_OPTIONS='--max-old-space-size=4096' yarn build
