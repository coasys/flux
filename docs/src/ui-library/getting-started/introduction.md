# Welcome to Flux UI

Introducing Flux UI, the ultimate collection of web components for all you Flux fanatics out there! Whether you're a seasoned developer or a newbie just getting started, this UI library has everything you need to create stunning apps for your Flux communities.

With Flux UI you get:

- A collection of the most commonly used **UI components** for app development
- A comprehensive set of **CSS variables** to customize your app's look and feel
- Built on web components making the UI elements **work in any framework** (Vue, React, Svelte, etc)
- A selection of **awesome themes**, and the possibility to make your own

Here is a minimal example of how you could compose a simple chat message with Flux UI:

<j-flex gap="300">
  <j-box>
    <j-avatar size="sm" hash="did:1234"></j-avatar>
  </j-box>
  <j-box>
    <j-box bg="primary-200" px="400" py="300" radius="md">
      Sure, I'll be there soon!
    </j-box>
    <j-text size="300" color="ui-400">
      <j-flex a="center" gap="200">
      <j-timestamp relative value="04/01/2023"></j-timestamp>
      <j-icon name="check-all" size="sm" color="success-300"></j-icon>
      </j-flex>
    </j-text>
  </j-box>
</j-flex>

```html
<j-flex gap="300">
  <j-box>
    <j-avatar size="sm" hash="did:1234"></j-avatar>
  </j-box>
  <j-box>
    <j-box bg="primary-200" px="400" py="300" radius="md">
      Sure, I'll be there soon!
    </j-box>
    <j-text size="300" color="ui-400">
      <j-flex a="center" gap="200">
        <j-timestamp relative value="04/01/2023"></j-timestamp>
        <j-icon name="check-all" size="sm" color="success-300"></j-icon>
      </j-flex>
    </j-text>
  </j-box>
</j-flex>
```

::: tip
[Try our Playground](/playground.html) to use AI to compose components like this for your application.
:::
