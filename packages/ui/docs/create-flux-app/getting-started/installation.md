# Quick Start

## Prerequisites

Flux runs on top of [AD4M](https://ad4m.dev), a p2p framework where all data is stored and shared. In order to build a new Flux app you need to [download](https://ad4m.dev/download) and install AD4M.

## Get Started

To create a new Flux app, run the following:

::: code-group

```bash [npm]
npx create-flux-app
```

The wizard will ask you for the name of your app, as well as what framework you want to use

NB: This version of `create-flux-app` only supports preact. Support for more frameworks are planned in the future.

:::

Then install deps and start building

::: code-group

```bash [npm]
cd [app-name]
npm install
npm run dev
```

:::
