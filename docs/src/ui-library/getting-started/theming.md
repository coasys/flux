<script setup>
import {ref, watch, onMounted} from 'vue'

const theme = ref("");

watch(theme, val => {
   document.documentElement.className = "";
   if(val) {
    document.documentElement.classList.add(val)
   } else {
    document.documentElement.className = "";
   }
})

onMounted(() => {
  const attrObserver = new MutationObserver((mutations) => {
  mutations.forEach(mu => {
    if (mu.type !== "attributes" && mu.attributeName !== "class") return;
    theme.value = mu.target.className;
    console.log("class was modified!", mu.target.classList.contains('dark'));
  });
});

  attrObserver.observe(document.documentElement, {attributes: true})
});


</script>

<style>
html.color {
  --j-color-primary-hue: 10; 
}
html.dark-mode {
  --j-color-subtractor: 100%;
  --j-color-multiplier: -1;
}
</style>

# Theme basics

Flux UI is designed with theming in mind, making it easy for you to customize its look and feel to suit your needs.

Flux UI's theming system is built using standard web APIs, which means you don't need to learn any new syntax or tools to customize the library's theme. All you need is a good understanding of CSS and CSS Variables.

To customize Flux UI's theme, you'll need to define values for the various CSS Variables that are used throughout the library's styles. These variables control things like colors, font sizes, and spacing, among other things. By changing the values of these variables, you can customize the look and feel of Flux UI to suit your needs.

## Built in themes

Flux already comes with a couple of themes that you can try out:

<j-flex gap="400">
<j-radio-button :checked="theme === ''" name="theme" @change="e => theme = e.target.value" value="">Default</j-radio-button>
<j-radio-button :checked="theme === 'dark'" name="theme" @change="e => theme = e.target.value" value="dark">
dark.css
</j-radio-button>
<j-radio-button :checked="theme === 'cyberpunk'" name="theme" @change="e => theme = e.target.value" value="cyberpunk">
cyberpunk.css
</j-radio-button>
<j-radio-button :checked="theme === 'retro'" name="theme" @change="e => theme = e.target.value" value="retro">
retro.css
</j-radio-button>
<j-radio-button :checked="theme === 'black'" name="theme" @change="e => theme = e.target.value" value="black">
black.css
</j-radio-button>
</j-flex>

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
