---
name: flux
description: Build and run Flux — the social web app for AD4M communities. Use when setting up the Flux development environment, building views/plugins, connecting to an AD4M executor, troubleshooting the Vue app, or packaging for desktop (Electron) or mobile (Capacitor).
---

# Flux

Flux is a social collaboration platform built on AD4M. It's a **Vue 3 + Vite** monorepo with Lit-based UI components, pluggable views, and multi-platform targets (web, Electron desktop, Capacitor mobile).

**Live:** https://app.fluxsocial.io
**Docs:** https://docs.fluxsocial.io
**Repo:** https://github.com/coasys/flux

> **Flux ≠ AD4M Launcher.** The AD4M Launcher lives in the `ad4m` repo at `ui/`. Flux is a separate application that *connects to* a running AD4M executor.

## Prerequisites

- **Node.js 18+** with **yarn** (v1/classic)
- A **running AD4M executor** (see the `ad4m-executor` skill or [download AD4MIN](https://github.com/perspect3vism/ad4m))
- For Electron desktop builds: platform-specific build tools
- For mobile builds: see `MOBILE-SETUP.md` (Android Studio / Xcode + Capacitor 6)

## Quick Start

```bash
git clone https://github.com/coasys/flux.git && cd flux
yarn install
yarn dev
# → Flux web app at http://127.0.0.1:5173
```

`yarn dev` runs all packages in parallel via Turborepo. On first load, Flux prompts for an AD4M executor URL.

## Monorepo Structure

```text
flux/
├── app/                    # Main Vue 3 app (Vite + Capacitor)
│   ├── src/                # Vue components, router, stores, views
│   ├── android/            # Capacitor Android project
│   ├── ios/                # Capacitor iOS project
│   └── vite.config.js
├── packages/               # Shared libraries
│   ├── ui/                 # @coasys/flux-ui — Lit web components (buttons, inputs, etc.)
│   ├── api/                # @coasys/flux-api — AD4M data layer
│   ├── vue/                # @coasys/flux-vue — Vue composables for AD4M
│   ├── types/              # @coasys/flux-types — TypeScript types
│   ├── constants/          # @coasys/flux-constants
│   ├── utils/              # @coasys/flux-utils
│   ├── flux-container/     # @coasys/flux-container — WE applet container
│   ├── flux-editor/        # @coasys/flux-editor — rich text editor
│   ├── comment-section/    # @coasys/flux-comment-section
│   ├── react-web/          # @coasys/flux-react-web — React bridge
│   ├── webrtc/             # @coasys/flux-webrtc — WebRTC utilities
│   └── create/             # @coasys/create-flux-plugin — plugin scaffolding CLI
├── views/                  # Pluggable view modules (loaded into channels)
│   ├── chat-view/          # @coasys/flux-chat-view
│   ├── kanban-view/        # @coasys/flux-kanban-view
│   ├── post-view/          # @coasys/flux-post-view
│   ├── graph-view/         # @coasys/flux-graph-view
│   ├── table-view/         # @coasys/flux-table-view
│   ├── poll-view/          # @coasys/flux-poll-view
│   ├── webrtc-view/        # @coasys/flux-webrtc-view
│   ├── synergy-demo-view/  # @coasys/flux-synergy-demo-view
│   └── ...
├── electron/               # Electron desktop shell (electron-forge)
├── docs/                   # VitePress documentation site
├── we-seed.json            # WE app manifest (theme, AI config, perspectives)
└── turbo.json              # Turborepo task config
```

## Build Order

Turborepo handles dependency ordering. For manual builds:

```bash
# Full build (respects turbo dependency graph)
yarn build

# Granular (when working on specific packages)
yarn workspace @coasys/flux-ui build          # 1. Lit components
yarn workspace @coasys/flux-api build         # 2. API layer
yarn workspace @coasys/flux-vue build         # 3. Vue composables
yarn workspace flux build                     # 4. Main app
```

The `turbo.json` defines the chain: `ui → packages → views → app`.

## Connecting to an AD4M Executor

Flux uses `@coasys/ad4m-connect` for executor discovery, capability auth, and JWT management.

### Local executor
Default: `http://127.0.0.1:12100` — works out of the box.

### Remote executor (TLS required)
Browsers require HTTPS for non-localhost WebSocket connections. The executor must run with `--tls-cert-file` and `--tls-key-file`.

1. Start executor with TLS (serves HTTPS on port 12001)
2. **Accept the self-signed cert first:** visit `https://<executor-ip>:12001` directly in the browser
3. Point Flux at `https://<executor-ip>:12001`

Without step 2, WebSocket connections silently fail.

### Multi-user mode
For multiple users connecting to one executor:
1. `agentGenerate` must have been called (creates JWT signing key)
2. `runtimeSetMultiUserEnabled(enabled: true)` via GraphQL
3. Create user accounts with `runtimeCreateUser` mutation
4. Users log in with email/password via Flux UI

## Key Packages

| Package | npm Name | Framework | Purpose |
|---------|----------|-----------|---------|
| `app/` | `flux` (not published) | Vue 3 + Vite | Main web/mobile/desktop shell |
| `packages/ui/` | `@coasys/flux-ui` | Lit | Reusable web components |
| `packages/api/` | `@coasys/flux-api` | — | AD4M data layer, subject classes |
| `packages/vue/` | `@coasys/flux-vue` | Vue 3 | Composables (`useAgent`, `usePerspective`, etc.) |
| `packages/flux-container/` | `@coasys/flux-container` | — | WE applet container runtime |
| `packages/react-web/` | `@coasys/flux-react-web` | React 18 | React bridge for embedding in React apps |
| `views/*` | `@coasys/flux-*-view` | Various | Channel view plugins |

### AD4M dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@coasys/ad4m` | `0.11.1` | TypeScript types + `Ad4mClient` |
| `@coasys/ad4m-connect` | `0.11.1` | Executor connection + auth |
| `@coasys/ad4m-vue-hooks` | `0.11.1` | Vue hooks for AD4M |

## Views (Pluggable Modules)

Views are self-contained UI modules that render inside Flux channels. Each view is a separate package under `views/` with its own build.

To create a new view:
```bash
yarn workspace @coasys/create-flux-plugin create
```

Views are loaded dynamically and can use any framework — they're isolated web components.

## Desktop (Electron)

```bash
# Build the web app first
cd electron
yarn run build-electron    # Builds Vite with VITE_BASE='./'
yarn run start             # Dev mode with electron-forge
yarn run make              # Package for current platform
yarn run make-linux        # Package for Linux
yarn run make-windows      # Package for Windows
```

The Electron build wraps the Flux web app — it does **not** embed an AD4M executor. Users still need a running executor.

## Mobile (Capacitor)

See `MOBILE-SETUP.md` for full setup guide. Summary:

```bash
cd app
yarn build                 # Build web assets to dist/
npx cap sync               # Sync to native projects
npx cap open android       # Open in Android Studio
npx cap open ios           # Open in Xcode
```

**App ID:** `org.coasys.flux`
**Capacitor version:** 6.0.0

## Documentation Site

```bash
cd docs
yarn dev                   # VitePress dev server
yarn build                 # Build static site
```

Deployed to https://docs.fluxsocial.io via Netlify.

## Deployment

- **Web:** Netlify auto-deploys from PRs and main branch
- **PR previews:** Every PR gets a Netlify deploy preview URL (posted as a comment)
- **Desktop:** `electron/` builds via electron-forge
- **Mobile:** Capacitor → native IDE build

## Common Issues

| Symptom | Cause | Fix |
|---------|-------|-----|
| Flux loads but can't connect | Executor not running or wrong URL | Verify executor at `http://127.0.0.1:12100` |
| WebSocket fails to remote executor | Self-signed cert not accepted | Visit `https://<ip>:12001` in browser first |
| `Capability not matched... LOGIN` | Multi-user mode disabled on executor | `runtimeSetMultiUserEnabled(enabled: true)` |
| Auth prompt loops | Admin credential mismatch | Match `--admin-credential` value |
| Blank page after build | Stale Vite cache | `cd app && yarn dev --force` |
| `@coasys/flux-ui` types missing | UI package not built | `yarn workspace @coasys/flux-ui build` |
| Neighbourhood appears empty | Languages still loading on executor | Wait for "AD4M init complete" in executor logs |
| `patch-package` errors on install | Missing patches | `yarn postinstall` or check `patches/` dir |
| View not rendering in channel | View package not built | `yarn workspace @coasys/flux-<name>-view build` |
