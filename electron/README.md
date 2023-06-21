# Flux (Electron version)

An electron wrapper around flux.

### Running locally

> NB! Ensure you first run `yarn build` from the electron folder to ensure build is compatible with the wrapper. This sets the base directory to `./` so that the files can be served locally.

```
yarn install
yarn start
```

### Make/Package commands

- `yarn make` Make app for current platform
- `yarn make-linux` Make app for linux
- `yarn make-windows` Make app for windows

- `yarn package` Package app
- `yarn package-x64` Package for intel macbooks

## Known limitations

- When on a network without internet access, the app takes a while to load as it first tries to fetch CDN assets.
- When truly offline (no network at all) chrome rejects any connections, even to localhost.
