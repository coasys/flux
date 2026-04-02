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


# DIAGNOSTIC: Write AD4M link status to a file we can check
mkdir -p app/dist
echo "AD4M_LINKED=$AD4M_LINKED" > app/dist/ad4m-link-status.txt
echo "BRANCH=$BRANCH" >> app/dist/ad4m-link-status.txt
echo "node_modules/@coasys/ad4m exists: $([ -e node_modules/@coasys/ad4m ] && echo YES || echo NO)" >> app/dist/ad4m-link-status.txt
echo "node_modules/@coasys/ad4m type: $(file node_modules/@coasys/ad4m 2>/dev/null || echo MISSING)" >> app/dist/ad4m-link-status.txt
echo "find results:" >> app/dist/ad4m-link-status.txt
find . -path "*/node_modules/@coasys/ad4m" ! -path "./ad4m/*" >> app/dist/ad4m-link-status.txt 2>&1
echo "---" >> app/dist/ad4m-link-status.txt
# Replace ALL copies of @coasys/ad4m with the branch-built version
if [ "$AD4M_LINKED" = true ]; then
  echo "==> Replacing @coasys/ad4m in all node_modules locations"
  
  AD4M_CORE_SRC="$(pwd)/ad4m/core"
  AD4M_CONNECT_SRC="$(pwd)/ad4m/connect"
  
  # Explicitly replace the root-level copy first (most critical)
  if [ -e node_modules/@coasys/ad4m ]; then
    echo "  Replacing root node_modules/@coasys/ad4m"
    rm -rf node_modules/@coasys/ad4m
    cp -R "$AD4M_CORE_SRC" node_modules/@coasys/ad4m
  fi
  if [ -e node_modules/@coasys/ad4m-connect ]; then
    echo "  Replacing root node_modules/@coasys/ad4m-connect"
    rm -rf node_modules/@coasys/ad4m-connect
    cp -R "$AD4M_CONNECT_SRC" node_modules/@coasys/ad4m-connect
  fi
  
  # Find and replace EVERY other instance in nested node_modules
  # Use -type d OR -type l to catch both real directories and symlinks
  find . -path '*/node_modules/@coasys/ad4m' \( -type d -o -type l \) ! -path './ad4m/*' | while read -r target; do
    echo "  Replacing $target"
    rm -rf "$target"
    cp -R "$AD4M_CORE_SRC" "$target"
  done
  
  # Same for @coasys/ad4m-connect
  find . -path '*/node_modules/@coasys/ad4m-connect' \( -type d -o -type l \) ! -path './ad4m/*' | while read -r target; do
    echo "  Replacing $target"
    rm -rf "$target"
    cp -R "$AD4M_CONNECT_SRC" "$target"
  done
  
  # Clear ALL caches — turbo, vite, and node_modules caches
  rm -rf app/node_modules/.vite .turbo node_modules/.cache
  # Also clear turbo cache in every workspace package
  find . -name '.turbo' -type d ! -path './ad4m/*' -exec rm -rf {} + 2>/dev/null || true
  find . -path '*/node_modules/.vite' -type d ! -path './ad4m/*' -exec rm -rf {} + 2>/dev/null || true
  find . -path '*/node_modules/.cache' -type d ! -path './ad4m/*' -exec rm -rf {} + 2>/dev/null || true
  
  # Verify the replacement worked
  COUNT=$(find . -path '*/node_modules/@coasys/ad4m' ! -path './ad4m/*' | wc -l | tr -d ' ')
  echo "==> AD4M packages replaced in $COUNT locations"
  
  # Verify the root copy has Model export
  if grep -q 'Model' node_modules/@coasys/ad4m/lib/index.js 2>/dev/null; then
    echo "==> ✅ Verified: root node_modules/@coasys/ad4m has Model export"
  else
    echo "==> ❌ ERROR: root node_modules/@coasys/ad4m MISSING Model export!"
    echo "==> Diagnostics:"
    echo "  node_modules/@coasys/ad4m exists: $([ -e node_modules/@coasys/ad4m ] && echo YES || echo NO)"
    echo "  node_modules/@coasys/ad4m is symlink: $([ -L node_modules/@coasys/ad4m ] && echo YES || echo NO)"
    echo "  node_modules/@coasys/ad4m/lib exists: $([ -d node_modules/@coasys/ad4m/lib ] && echo YES || echo NO)"
    echo "  node_modules/@coasys/ad4m/lib/index.js exists: $([ -f node_modules/@coasys/ad4m/lib/index.js ] && echo YES || echo NO)"
    ls -la node_modules/@coasys/ad4m/ 2>/dev/null || echo "  Cannot list directory"
    ls -la node_modules/@coasys/ad4m/lib/ 2>/dev/null || echo "  Cannot list lib/"
    echo "  AD4M_CORE_SRC contents:"
    ls -la "$AD4M_CORE_SRC/lib/" 2>/dev/null | head -5
    # Write diagnostics to a file that will be in the deploy output
    mkdir -p app/dist
    echo "AD4M LINK DIAGNOSTICS" > app/dist/ad4m-diag.txt
    echo "root nm exists: $([ -e node_modules/@coasys/ad4m ] && echo YES || echo NO)" >> app/dist/ad4m-diag.txt
    echo "root nm is symlink: $([ -L node_modules/@coasys/ad4m ] && echo YES || echo NO)" >> app/dist/ad4m-diag.txt
    echo "root nm/lib exists: $([ -d node_modules/@coasys/ad4m/lib ] && echo YES || echo NO)" >> app/dist/ad4m-diag.txt
    echo "root nm/lib/index.js exists: $([ -f node_modules/@coasys/ad4m/lib/index.js ] && echo YES || echo NO)" >> app/dist/ad4m-diag.txt
    find . -path '*/node_modules/@coasys/ad4m' ! -path './ad4m/*' >> app/dist/ad4m-diag.txt 2>&1
    echo "Model in lib/index.js: $(grep -c 'Model' node_modules/@coasys/ad4m/lib/index.js 2>/dev/null || echo 0)" >> app/dist/ad4m-diag.txt
    # DON'T exit — let the build continue so we can see what vite sees
  fi
fi

NODE_OPTIONS='--max-old-space-size=4096' yarn build
