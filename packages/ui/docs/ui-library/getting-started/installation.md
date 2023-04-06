# Installation

You can install the Flux UI components like this:

::: code-group

```bash [npm]
npm install @fluxapp/ui
```

```bash [yarn]
yarn add @fluxapp/ui
```

```html [cdn]
<script src="unpkg.com/@fluxapp/ui"></script>
```

:::

Then import it in your app:

::: code-group

```js [bundler]
import "@fluxapp/ui/dist/main.css";
import "@fluxapp/ui";
```

```html [cdn]
<html>
  <head>
    <link href="unpkg.com/@fluxapp/ui/dist/main.css" />
    <script src="unpkg.com/@fluxapp/ui"></script>
  </head>
  <body>
    <div id="app"></div>
  </body>
</html>
```

:::
