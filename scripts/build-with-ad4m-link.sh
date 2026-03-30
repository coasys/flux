#!/bin/bash
set -e

# Detect PR branch from Netlify environment
BRANCH="${BRANCH:-$HEAD}"
echo "Current branch: $BRANCH"

# Check if matching AD4M branch exists
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  "https://api.github.com/repos/coasys/ad4m/branches/$BRANCH")

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Found matching AD4M branch: $BRANCH — building from source"

  # Clone and build AD4M
  git clone --depth 1 --single-branch --branch "$BRANCH" \
    https://github.com/coasys/ad4m.git /tmp/ad4m
  cd /tmp/ad4m
  npm install -g pnpm
  pnpm install --no-frozen-lockfile
  cd core && pnpm exec tsc && pnpm run bundle && cd ..
  cd connect && pnpm run build && cd ..
  cd ad4m-hooks/helpers && pnpm exec tsc 2>/dev/null || true && cd ../..
  cd ad4m-hooks/react && pnpm exec tsc 2>/dev/null || true && cd ../..
  cd ad4m-hooks/vue && pnpm exec tsc 2>/dev/null || true && cd ../..

  # Link into Flux
  cd /tmp/ad4m/core && yarn link && cd /opt/build/repo
  cd /tmp/ad4m/connect && yarn link && cd /opt/build/repo
  cd /tmp/ad4m/ad4m-hooks/helpers && yarn link && cd /opt/build/repo
  cd /tmp/ad4m/ad4m-hooks/react && yarn link && cd /opt/build/repo
  cd /tmp/ad4m/ad4m-hooks/vue && yarn link && cd /opt/build/repo

  yarn link @coasys/ad4m @coasys/ad4m-connect @coasys/hooks-helpers @coasys/ad4m-react-hooks @coasys/ad4m-vue-hooks
  rm -rf app/node_modules/.vite .turbo

  echo "✅ AD4M packages linked from branch: $BRANCH"
else
  echo "ℹ️ No matching AD4M branch — using published packages"
fi

# Build Flux
NODE_OPTIONS='--max-old-space-size=4096' yarn build
