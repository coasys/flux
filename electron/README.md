# Flux (Electron version)

An electron wrapper around flux.

### Running locally

```
yarn install
yarn start
```

### Make/Package commands

> NB! Ensure you run `yarn build` from the electron folder to ensure build is compatible with the wrapper. This sets the base directory to `./` so that the files can be served locally.

- `yarn make` Make app for current platform
- `yarn make-linux` Make app for linux
- `yarn make-windows` Make app for windows

- `yarn package` Package app
- `yarn package-x64` Package for intel macbooks

## Known limitations

- Icons not currently working
- Font not currently working
