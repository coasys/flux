<script setup>
import {ref, watch} from 'vue'

const theme = ref("default");

watch(theme, val => {
   document.documentElement.className = "";
   document.documentElement.classList.add(val)
})
</script>

# Theme basics

Flux UI is designed with theming in mind, making it easy for you to customize its look and feel to suit your needs.

Flux UI's theming system is built using standard web APIs, which means you don't need to learn any new syntax or tools to customize the library's theme. All you need is a good understanding of CSS and CSS Variables.

To customize Flux UI's theme, you'll need to define values for the various CSS Variables that are used throughout the library's styles. These variables control things like colors, font sizes, and spacing, among other things. By changing the values of these variables, you can customize the look and feel of Flux UI to suit your needs.

## Using a theme

Flux already comes with a couple of themes that you can try out:

<j-tabs wrap variant="button" :value="theme" @change="e => theme = e.target.value">
<j-tab-item value="default">default (light)</j-tab-item>
<j-tab-item value="dark">dark.css</j-tab-item>
<j-tab-item value="cyberpunk">cyperpunk.css</j-tab-item>
<j-tab-item value="retro">retro.css</j-tab-item>
<j-tab-item value="black">black.css</j-tab-item>
</j-tabs>

::: tip
When using `create-flux-app`, you should not need to do this. Theming is controlled by the user, and you should not hard code that.
:::

To use them in your project import one of them like this:

```js
import "@fluxsocial/ui/themes/{name}.css";
```

And then add the name to the html element like this:

```html
<html class="dark">
  <head></head>
  <body></body>
</html>
```

## Creating your own theme

### Changing CSS variables

Change the primary hue value to change the primary color like this:

<j-button :variant="theme === 'color' ? 'primary' : ''" @click="theme = 'color'">
{{theme === 'color' ? 'Activated' : 'Activate'}}
</j-button>

```css
html.color {
  --j-color-primary-hue: 10;
}
```

Or create a simple dark mode by just modifying two properties:

<j-button :variant="theme === 'dark-mode' ? 'primary' : ''" @click="theme = 'dark-mode'">
{{theme === 'dark-mode' ? 'Activated' : 'Activate'}}
</j-button>

```css
html.dark-mode {
  --j-color-subtractor: 100%;
  --j-color-multiplier: -1;
}
```

<style>
html.color {
  --j-color-primary-hue: 10; 
}
html.dark-mode {
  --j-color-subtractor: 100%;
  --j-color-multiplier: -1;
}
</style>
