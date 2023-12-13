# Quick Start

## Using @coasys/create-flux-plugin

We've created `@coasys/create-flux-plugin` to get you quickly up and running with a minimal boilerplate. To create a new Flux Plugin, run in your terminal:

```bash
npx @coasys/create-flux-plugin
```

The terminal will ask you for the name of your plugin, as well as what framework you want to use (for now we only support preact).

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
npx install @coasys/ad4m-connect @coasys/ad4m @coasys/flux-container
```

- 2: Wrap your Plugin in the flux-container web-component

```
<flux-container>
    <your-plugin />
</flux-container>
```
