# Junto

## Environment
Node version: 14.16.0<br>

## Project setup
This project requires nix for building holochain! You can download nix here: https://nixos.wiki/wiki/Nix_Installation_Guide

```
npm install && npm run build-languages && npm run build-holochain
```

### Compiles and hot-reloads for development
```
npm run electron:serve
```

## Cleaning local state

The following commands will remove all installed ad4m languages (except defaults), holochain DNA's, ad4m did store & vuex store.

```
npm run clean-state
```

Once complete inside the browser windows console run localStorage.clear(). Restart application and you will have a fresh state.

## Holochain DNA's

This project makes use of the following holochain DNA's.

[Social-Context](https://github.com/juntofoundation/Social-Context) link store DNA for persistence & signaling of links <br>
[ShortForm-Expression](https://github.com/juntofoundation/Short-Form-Expression) DNA for text posting (more expression types to follow soon)<br>
[Agent-Profiles](https://github.com/jdeepee/profiles) DNA for basic profile registration (optional for each agent)<br>
[Language-Persistence](https://github.com/perspect3vism/language-persistence) DNA for the storing of language meta information under a given key<br>

These DNA's come bundled with the builtin languages, links above are provided for reference to anyone interested.

### Compiles and minifies for production
```
npm run build-holochain && npm run build-languages && npm run electron:build
```

### Lints and fixes files
```
npm run lint
```