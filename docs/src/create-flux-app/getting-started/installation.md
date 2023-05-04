# Quick Start

## Using create-flux-app

We've created `create-flux-app` to get you quickly up and running with a minimal boilerplate. To create a new Flux App, run in your terminal:

```bash
npx create-flux-app
```

The terminal will ask you for the name of your app, as well as what framework you want to use (for now we only support preact).

Then install the dependencies and start your development server:

```bash
cd [app-name]
npm install
npm run dev
```

## Manual setup

If you'd rather use another framework, or just prefer to set everything up yourself you are free to do so.

- 1: Initialize a new project and add the required packages:

```bash
npx install @perspect3vism/ad4m-connect @perspect3vism/ad4m @fluxapp/flux-container
```

- 2: Wrap your app in the flux-container web-component

```
<flux-container>
    <your-app />
</flux-container>
```
