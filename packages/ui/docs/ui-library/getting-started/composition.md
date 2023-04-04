<script setup>
import {ref, watch} from 'vue'

const theme = ref(document.documentElement.className);

watch(theme, val => {
   document.documentElement.className = "";
   if(val) {
    document.documentElement.classList.add(val)
   } else {
    document.documentElement.className = "";
   }
})


const attrObserver = new MutationObserver((mutations) => {
  mutations.forEach(mu => {
    if (mu.type !== "attributes" && mu.attributeName !== "class") return;
    theme.value = mu.target.className;
    console.log("class was modified!", mu.target.classList.contains('dark'));
  });
});

attrObserver.observe(document.documentElement, {attributes: true})

</script>

# Composition

When creating a Flux app you might not always find the component you are looking for to build the UI. While you are free to create whatever layout fits for you app needs, we highly reccomend you to use the CSS variables provided by Flux UI to comply with user theming.

Let's say you want to make a list of cards. First of all, Flux UI doesn't have a `j-card` component, and it also doesn't provide any `j-grid` component. So how do we make this but still make sure we adhere to the theming?

## Example

First let's have a look at the markup we need to create our grid of cards:

```html
<div class="grid">
  <article class="card">
    <img src="https://picsum.photos/600/300" />
    <j-box p="500">
      <j-text uppercase size="300">Travel</j-text>
      <j-text variant="heading">Trip Planning for beginners</j-text>
      <j-text variant="body">
        Lorem Ipsum is simply dummy text of the printing and typesetting
        industry. Lorem Ipsum has been the industry's standard dummy text ever
        since the 1500s.
      </j-text>
      <j-button variant="primary">Read more</j-button>
    </j-box>
  </article>
  <article class="card">
    <img src="https://picsum.photos/600/300" />
    <j-box p="500">
      <j-text uppercase size="300">Travel</j-text>
      <j-text variant="heading">Trip Planning for beginners</j-text>
      <j-text variant="body">
        Lorem Ipsum is simply dummy text of the printing and typesetting
        industry. Lorem Ipsum has been the industry's standard dummy text ever
        since the 1500s.
      </j-text>
      <j-button variant="primary">Read more</j-button>
    </j-box>
  </article>
  <article class="card">
    <img src="https://picsum.photos/600/300" />
    <j-box p="500">
      <j-text uppercase size="300">Travel</j-text>
      <j-text variant="heading">Trip Planning for beginners</j-text>
      <j-text variant="body">
        Lorem Ipsum is simply dummy text of the printing and typesetting
        industry. Lorem Ipsum has been the industry's standard dummy text ever
        since the 1500s.
      </j-text>
      <j-button variant="primary">Read more</j-button>
    </j-box>
  </article>
</div>
```

As you can see we use Flux components wherever we can, but we also add some HTML tags like `article` and `div` and give them classes so we can style them accordingly.

Now let's have a look at our custom CSS

```css
.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--j-space-500);
}

.card {
  cursor: pointer;
  width: 100%;
  background: var(--j-color-ui-100);
  border: 1px solid var(--j-color-ui-200);
  border-radius: var(--j-border-radius);
  overflow: hidden;
}

.card:hover {
  background: var(--j-color-ui-200);
}
```

In our CSS we try to use the variables that come out of the box with Flux UI to make sure colors, spacing and other design tokens are following the Flux design system, and that theming works seamslessly.

Toggle the themes to see that the cards always look right with the current theming:

<j-box pb="500">
<j-radio-button :checked="theme === ''" name="theme" @change="e => theme = e.target.value" value="">Default</j-radio-button>
<j-radio-button :checked="theme === 'dark'" name="theme" @change="e => theme = e.target.value" value="dark">Dark</j-radio-button>
<j-radio-button :checked="theme === 'cyberpunk'" name="theme" @change="e => theme = e.target.value" value="cyberpunk">
Cyberpunk
</j-radio-button>
<j-radio-button :checked="theme === 'retro'" name="theme" @change="e => theme = e.target.value" value="retro">Retro</j-radio-button>
</j-box>

<div class="grid">
  <article class="card">
    <img src="https://picsum.photos/600/300" />
    <j-box p="500">
      <j-text uppercase size="300">Travel</j-text>
      <j-text variant="heading">Trip Planning for beginners</j-text>
      <j-text variant="body">
        Lorem Ipsum is simply dummy text of the printing and typesetting
        industry. Lorem Ipsum has been the industry's standard dummy text ever
        since the 1500s.
      </j-text>
      <j-button variant="primary">Read more</j-button>
    </j-box>
  </article>
  <article class="card">
    <img src="https://picsum.photos/600/300" />
    <j-box p="500">
      <j-text uppercase size="300">Travel</j-text>
      <j-text variant="heading">Trip Planning for beginners</j-text>
      <j-text variant="body">
        Lorem Ipsum is simply dummy text of the printing and typesetting
        industry. Lorem Ipsum has been the industry's standard dummy text ever
        since the 1500s.
      </j-text>
      <j-button variant="primary">Read more</j-button>
    </j-box>
  </article>
  <article class="card">
    <img src="https://picsum.photos/600/300" />
    <j-box p="500">
      <j-text uppercase size="300">Travel</j-text>
      <j-text variant="heading">Trip Planning for beginners</j-text>
      <j-text variant="body">
        Lorem Ipsum is simply dummy text of the printing and typesetting
        industry. Lorem Ipsum has been the industry's standard dummy text ever
        since the 1500s.
      </j-text>
      <j-button variant="primary">Read more</j-button>
    </j-box>
  </article>
</div>

<style scoped>

.grid {
 display: grid;
 grid-template-columns: 1fr 1fr;
 gap: var(--j-space-500);
}

.card {
  cursor: pointer;
  width: 100%;
  background: var(--j-color-ui-100);
  border: 1px solid var(--j-color-ui-200);
  border-radius: var(--j-border-radius);
  overflow: hidden;
}

.card:hover {
  background: var(--j-color-ui-200);
}
</style>
