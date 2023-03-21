---
outline: deep
---

# Modal

Modal component is used to display content in a layered window that appears above the page content.

## Usage

<j-button @click="() => isOpen = true">Open modal</j-button>

<j-modal size="sm" :open="isOpen" @toggle="e => isOpen = e.target.open">
<j-box p="500">
<j-text variant="heading-sm">Modal header</j-text>
<j-text variant="body">Modal content</j-text>
</j-box>
</j-modal>

::: code-group

```html [html]
<j-button>Open modal</j-button>

<j-modal>
  <j-box p="500">
    <j-text variant="heading-sm">Modal header</j-text>
    <j-text variant="body">Modal content</j-text>
  </j-box>
</j-modal>

<script>
  const button = document.querySelector("j-button");
  const modal = document.querySelect("j-modal");
  button.addEventListener("click", () => {
    modal.open = true;
  });
</script>
```

```jsx [preact]
export default function Checkbox() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <j-button onClick={() => setOpen(true)}>Open modal</j-button>
      <j-modal
        label="Name"
        open={open}
        onToggle={(e) => setOpen(e.target.open)}
      >
        <j-box p="500">
          <j-text variant="heading-sm">Modal header</j-text>
          <j-text variant="body">Modal content</j-text>
        </j-box>
      </j-modal>
    </>
  );
}
```

```vue [vue]
<template>
  <j-button @click="() => (isOpen = true)">Open modal</j-button>

  <j-modal size="sm" :open="isOpen" @toggle="(e) => (isOpen = e.target.open)">
    <j-box p="500">
      <j-text variant="heading-sm">Modal header</j-text>
      <j-text variant="body">Modal content</j-text>
    </j-box>
  </j-modal>
</template>

<script setup>
import { ref } from "vue";
const isOpen = ref(false);
</script>
```

:::

## Properties

### Size <Badge type="info" text="string" />

Use the size property to change the size of the modal. You can set the value to xs, sm, md, lg, xl, or fullscreen.

```html
<j-modal size="sm">
  <j-box p="500">
    <j-text variant="heading-sm">Modal header</j-text>
    <j-text variant="body">Modal content</j-text>
  </j-box>
</j-modal>
```

### Open <Badge type="info" text="boolean" />

Use the open property to control whether the modal is visible or not.

```html
<j-modal open>
  <template slot="header">Modal header</template>
  Modal content
  <template slot="footer">Modal footer</template>
</j-modal>
```

## Slots

### Header

Use the header slot to provide a custom header for the modal.

<j-modal size="md">
  <template slot="header">
    <h2>Custom header</h2>
  </template>
  Modal content
  <template slot="footer">Modal footer</template>
</j-modal>

```html
<j-modal size="md">
  <template slot="header">
    <h2>Custom header</h2>
  </template>
  Modal content
  <template slot="footer">Modal footer</template>
</j-modal>
```

### Footer

Use the footer slot to provide a custom footer for the modal.

<j-modal size="lg">
  <template slot="header">Modal header</template>
  Modal content
  <template slot="footer">
    <button>Cancel</button>
    <button>Save</button>
  </template>
</j-modal>

```html
<j-modal size="lg">
  <template slot="header">Modal header</template>
  Modal content
  <template slot="footer">
    <button>Cancel</button>
    <button>Save</button>
  </template>
</j-modal>
```

## Events

### Toggle

The toggle event is fired when the modal `open` property is set to either to `false` or `true`;

```js
const modal = document.querySelector("j-modal");
modal.addEventListener("toggle", (event) => {
  console.log("Modal is open:", event.target.open);
});
```

<script setup>
import {ref} from 'vue';

const isOpen = ref(false)


</script>
