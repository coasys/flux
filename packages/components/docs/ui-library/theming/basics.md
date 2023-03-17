# Theme basics

Flux UI is designed with theming in mind, making it easy for you to customize its look and feel to suit your needs.

Flux UI's theming system is built using standard web APIs, which means you don't need to learn any new syntax or tools to customize the library's theme. All you need is a good understanding of CSS and CSS Variables.

To customize Flux UI's theme, you'll need to define values for the various CSS Variables that are used throughout the library's styles. These variables control things like colors, font sizes, and spacing, among other things. By changing the values of these variables, you can customize the look and feel of Flux UI to suit your needs.

## Changing the primary color

Change the primary hue value to change the primary color like this:

<j-toggle @change="e => toggle(e, 'color')">Toggle</j-toggle>

```css
html.color {
  --j-color-primary-hue: 10;
}
```

<style>
html.color {
  --j-color-primary-hue: 10; 
}
</style>

## Dark mode

Create a simple dark mode by just modifying two properties:

<j-toggle @change="e => toggle(e, 'dark')">Toggle</j-toggle>

```css
html.dark {
  --j-color-subtractor: 110%;
  --j-color-multiplier: -1;
}
```

<style>

.html.dark {
  --j-color-subtractor: 110%;
  --j-color-multiplier: -1;
}
</style>

<script setup>
import {ref} from 'vue'

function toggle(e, val) {
    if(e.target.checked) {
        document.documentElement.classList.add(val)
    } else {
        document.documentElement.classList.remove(val)
    }
    
}


</script>
