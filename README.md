# Flux by Junto

[![Build/release](https://github.com/juntofoundation/communities/actions/workflows/release.yml/badge.svg)](https://github.com/juntofoundation/communities/actions/workflows/release.yml)

## Environment
Node version: 14.16.0<br>

## Project setup
This project requires nix for building holochain! You can download nix here: https://nixos.wiki/wiki/Nix_Installation_Guide

Once Nix is installed it also recommended to use the holochain cachix, this can be enabled with the following commands:

```
nix-env -iA cachix -f https://cachix.org/api/v1/install
cachix use holochain-ci
```

Installing dependencies for flux and compiling holochain can be done with:

```
npm install && npm run get-languages && npm run build-holochain
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

## Holochain DNA's

This project makes use of the following holochain DNA's.

- [Social-Context](https://github.com/juntofoundation/Social-Context) link store DNA for persistence & signaling of links
- [ShortForm-Expression](https://github.com/juntofoundation/ad4m-languages/tree/master/shortform-expression) DNA for text posting (more expression types to follow soon)
- [Group-Expression](https://github.com/juntofoundation/ad4m-languages/tree/master/group-expression) DNA to store group metadata
- [Profile-Expression](https://github.com/jdeepee/profiles) DNA for basic profile registration (optional for each agent)
- [Language-Persistence](https://github.com/perspect3vism/language-persistence) DNA for the storing of language meta information under a given key
- [Neighbourhood-Persistence](https://github.com/perspect3vism/neighbourhood-language) DNA/ad4m language for storing neighbourhood objects
- [Agent-Language](https://github.com/perspect3vism/agent-language) DNA/ad4m language for storing ad4m Agent objects

These DNA's come bundled with the builtin languages, links above are provided for reference to anyone interested.

### Compiles and minifies for production
```
npm run build-holochain && npm run get-languages && npm run electron:build
```

### Lints and fixes files
```
npm run lint
```
