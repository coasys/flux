# Publish your Plugin to NPM

## Main export

Since Flux Plugins use web-components as channels/views, your main export needs to be an instance of a HTMLElement.

This example shows how to turn a preact app into a web component using the bundled `custom-element.js` file.

```ts
// main.ts

import register from "../utils/custom-element.js";
import App from "./App";

const CustomElement = register.toCustomElement(App, ["perspective", "source"], {
  shadow: false,
});

export default CustomElement;
```

## NPM Package

In order to make your Flux Plugin available to your and/or other commities you need to first update your package.json

This will allow the app to be discovered by the Flux Plugin Store.

```json
{
  "name": "your-flux-app",
  "version": "1.0.0",
  "fluxplugin": {
    // [!code ++]
    "name": "your-flux-plugin", // [!code ++]
    "description": "Description of your plugin", // [!code ++]
    "icon": "icon-name" // [!code ++]
  }, // [!code ++]
  "keywords": [
    // [!code ++]
    "flux-plugin" // [!code ++]
  ], // [!code ++]
  "scripts": {},
  "dependencies": {}
}
```

After this is done, publish your npm package.
