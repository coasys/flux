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

  echo "==> Building hooks"
  cd ad4m-hooks/helpers && pnpm exec tsc && cd ../..
  cd ad4m-hooks/react && pnpm exec tsc && cd ../..
  cd ad4m-hooks/vue && pnpm exec tsc && cd ../..

  # Yarn link each package
  cd core && yarn link && cd ..
  cd connect && yarn link && cd ..
  cd ad4m-hooks/helpers && yarn link && cd ../..
  cd ad4m-hooks/react && yarn link && cd ../..
  cd ad4m-hooks/vue && yarn link && cd ../..
  cd ..

  yarn link @coasys/ad4m @coasys/ad4m-connect @coasys/hooks-helpers @coasys/ad4m-react-hooks @coasys/ad4m-vue-hooks
  rm -rf app/node_modules/.vite .turbo

  echo "==> AD4M packages linked successfully"
else
  echo "==> No matching AD4M branch — using published npm packages"
fi

# Install and build Flux
yarn install --frozen-lockfile || yarn install
NODE_OPTIONS='--max-old-space-size=4096' yarn build
