# Welcome to Flux UI

Introducing Flux UI, the ultimate collection of web components for all you Flux fanatics out there! Whether you're a seasoned developer or a newbie just getting started, this UI library has everything you need to create stunning apps for your Flux communities.

With Flux UI, you'll get a comprehensive set of components that are ready to use straight out of the box. And the best part? You won't need to waste precious time styling and theming each component yourself because it's all done for you! We know you're busy, and that's why we've got your back.

Here is a minimal example of how you could compose a simple chat message with Flux UI:

<j-flex gap="300">
  <j-box>
    <j-avatar size="sm" src="https://i.pravatar.cc/100"></j-avatar>
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
    <j-avatar src="https://i.pravatar.cc/100" online></j-avatar>
  </j-box>
  <j-box>
    <j-box px="400" py="300" bg="ui-100" radius="md">
      Sure, I'll be there soon!
    </j-box>
    <j-text size="300" color="ui-400">
      <j-timestamp relative value="04/01/2023"></j-timestamp>
    </j-text>
  </j-box>
</j-flex>
```

::: tip
[Try our Playground](/playground.html) to use AI to compose components like this for your application.
:::

Flux UI also comes loaded with CSS variables, making it super easy to customize the look and feel of your app. Whether you want to add your own branding or just tweak the colors to match your mood, Flux UI has got you covered.

What's more, Flux UI is completely framework agnostic, meaning you can use it with any frontend framework. Whether you're a React or Vue fan, Flux UI will work seamlessly with your favorite framework.

So what are you waiting for? Come and join the Flux UI community today and start building amazing apps with ease.
