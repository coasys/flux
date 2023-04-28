# Publish your app to NPM

::: info
The flux app-store is still WIP.
:::

In order to make your Flux App available to your and/or other commities you need to first update your package.json

This will allow the app to be discovered by the Flux app store.

```json
{
  "name": "your-flux-app",
  "version": "1.0.0",
  "fluxapp": { // [!code ++]
    "name": "your-flux-app", // [!code ++]
    "description": "Description of your app", // [!code ++]
    "icon": "icon-name" // [!code ++]
  }, // [!code ++]
  "keywords": [ // [!code ++]
    "flux-app" // [!code ++]
  ], // [!code ++]
  "scripts": {},
  "dependencies": {}
}
```

After this is done, publish your npm package.