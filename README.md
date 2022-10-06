# Flux

https://app.fluxsocial.io

## Project setup

This project requires AD4M! The easiest way to have an AD4M runtime operating, is to [download AD4MIN](https://github.com/perspect3vism/ad4min).

### Compiles and hot-reloads for development

```
yarn run dev
```

Any PR's will also trigger netlify to make a new deployment of your new branch, the URL for this branch will be included as a comment on your PR.

## Holochain DNA's

This project makes use of the following holochain DNA's.

- [perspective-diff-sync](https://github.com/perspect3vism/perspective-diff-sync) DNA/ad4m language for storing link data for ad4m perspectives
- [Agent-Language](https://github.com/perspect3vism/agent-language) DNA/ad4m language for storing ad4m Agent objects

These DNA's come bundled with the builtin languages, links above are provided for reference to anyone interested.

### Compiles and minifies for production

```
yarn run build
```

### Lints and fixes files

```
yarn run lint
```
