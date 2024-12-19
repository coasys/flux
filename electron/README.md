# Flux (Electron version)

An electron wrapper around flux.

### Running locally

> NB! Ensure you first run `pnpm build` from the electron folder to ensure build is compatible with the wrapper. This sets the base directory to `./` so that the files can be served locally.

```
pnpm install
pnpm start
```

### Make/Package commands

- `pnpm make` Make app for current platform
- `pnpm make-linux` Make app for linux
- `pnpm make-windows` Make app for windows

- `pnpm package` Package app
- `pnpm package-x64` Package for intel macbooks

## Known limitations

- When on a network without internet access, the app takes a while to load as it first tries to fetch CDN assets.
- When truly offline (no network at all) chrome rejects any connections, even to localhost.
