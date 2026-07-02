# Flux — Claude Code Context

## CI / Build

### Never commit `pnpm-lock.yaml` changes on feature branches that use the ad4m link

`scripts/build-with-ad4m-link.sh` overrides `@coasys/ad4m` and `@coasys/ad4m-connect` to
`file:` paths pointing at a locally-cloned ad4m repo. If the committed lockfile contains
npm-registry entries for those packages (e.g. `@coasys/ad4m-connect: 0.13.0-foo`), pnpm
must transition them to `file:` entries during `pnpm install --no-frozen-lockfile`. During
that re-resolution it detects `ad4m/pnpm-workspace.yaml` and absorbs the entire ad4m
workspace, then resolves transitive `file:` deps relative to the **ad4m** workspace root
instead of the flux root — producing double-path errors like
`Could not install from "/opt/build/repo/ad4m/ad4m/core"`.

**Cached Netlify builds (existing branches) never hit this** because node_modules already
has the npm versions installed and pnpm skips re-resolution. **Fresh-cache builds (new
branches) always hit it.** This is why the issue only surfaces on new branches.

**Rule:** when working on a branch that bumps or changes any `@coasys/ad4m*` version,
reset `pnpm-lock.yaml` to the `dev` baseline before pushing:

```bash
git checkout origin/dev -- pnpm-lock.yaml
```

Let CI regenerate the lockfile from scratch rather than committing one with stale npm
entries for packages that the build script will override to `file:` paths.
