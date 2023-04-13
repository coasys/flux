<script setup>

import {ref} from 'vue';

const open = ref(false);

</script>

# Toast

The Toast component is used to display a short-lived message to the user.

## Usage

<j-button @click="open = true">Show Toast</j-button>

<j-toast variant="success" autohide="5" :open="open" @toggle="e => open = e.target.open">
Your changes have been saved.
</j-toast>

::: code-group

```html [html]

<j-button>Show Toast</j-button>

<j-toast>
  Your changes have been saved.
</j-toggle>

<script>
  const button = document.querySelector("j-button");
  const toast = document.querySelect("j-toast");
  button.addEventListener("click", (e) => {
    toast.open = true;
  });
</script>
```

```js [preact]
export default function Toggle() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <j-button onClick={() => setOpen(true)}>Show Toast</j-button>
      <j-toast open={open} onToggle={(e) => setOpen(e.target.open)}>
        Your changes have been saved
      </j-toast>
    </>
  );
}
```

```vue [vue]
<template>
  <j-button @click="open = true">Show Toast</j-button>

  <j-toast :open="open" @toggle="(e) => (open = e.target.open)">
    Your changes have been saved.
  </j-toast>
</template>

<script setup>
import { ref } from "vue";
const open = ref(false);
</script>
```

:::

## Properties

### Variant <Badge type="info" text="string" />

Use the variant property to set the appearance of the Toast component. You can set the value to one of the following options: success, danger, or warning.

```html
<j-toast variant="danger">Error: Something went wrong.</j-toast>
```

### Open <Badge type="info" text="boolean" />

Use the open property to control whether the Toast component is currently visible or hidden.

```html
<j-toast open>Your changes have been saved.</j-toast>
```

### Autohide <Badge type="info" text="number" />

Use the `autohide` property to automatically hide the Toast component after a specified number of seconds.

```html
<j-toast autohide="5">Your changes have been saved.</j-toast>
```

## Slots

The `j-toast` component supports a default slot for displaying the message content.

## Events

### Toggle

The `toggle` event is fired when the toast component is shown or hidden. You can add an event listener to the `j-toast` element to handle this event, like so:

```js
const toast = document.querySelector("j-toast");
toast.addEventListener("toggle", (event) => {
  // Do something when the toast is shown or hidden
});
```
