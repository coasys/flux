---
outline: deep
---

# Menu Group

Menu Group component is used to group a set of menu items in a dropdown or popup menu.

## Usage

<j-menu>
  <j-menu-group collapsible title="Menu Group Title">
    <j-menu-item>Menu Item 1</j-menu-item>
    <j-menu-item>Menu Item 2</j-menu-item>
    <j-menu-item>Menu Item 3</j-menu-item>
  </j-menu-group>
</j-menu>

::: code-group

```html [html]
<j-menu>
  <j-menu-group collapsible title="Menu Group Title">
    <j-menu-item>Menu Item 1</j-menu-item>
    <j-menu-item>Menu Item 2</j-menu-item>
    <j-menu-item>Menu Item 3</j-menu-item>
  </j-menu-group>
</j-menu>

<script>
  const group = document.querySelector("j-menu-group");
  group.addEventListener("toggle", (e) => {
    console.log("group is toggled: ", e.currentTarget.open);
  });
</script>
```

```js [preact]
export default function Checkbox() {
  const [open, setOpen] = useState(false);

  return (
    <j-menu>
      <j-menu-group
        open={open}
        onToggle={(e) => setOpen(e.currentTarget.open)}
        collapsible
        title="Menu Group Title"
      >
        <j-menu-item>Menu Item 1</j-menu-item>
        <j-menu-item>Menu Item 2</j-menu-item>
        <j-menu-item>Menu Item 3</j-menu-item>
      </j-menu-group>
    </j-menu>
  );
}
```

```vue [vue]
<template>
  <j-menu>
    <j-menu-group
      :open="open"
      @oggle="(e) => (open = e.currentTarget.open)"
      collapsible
      title="Menu Group Title"
    >
      <j-menu-item>Menu Item 1</j-menu-item>
      <j-menu-item>Menu Item 2</j-menu-item>
      <j-menu-item>Menu Item 3</j-menu-item>
    </j-menu-group>
  </j-menu>
</template>

<script setup>
import { ref } from "vue";
const open = ref(false);
</script>
```

:::

## Properties

### Title <Badge type="info" text="string" />

Use the title property to set the title of the menu group. The title will be
displayed at the top of the menu group.

<j-menu>
  <j-menu-group title="Menu Group Title">
    <j-menu-item>Menu Item 1</j-menu-item>
    <j-menu-item>Menu Item 2</j-menu-item>
    <j-menu-item>Menu Item 3</j-menu-item>
  </j-menu-group>
</j-menu>

```html
<j-menu>
  <j-menu-group title="Menu Group Title">
    <j-menu-item>Menu Item 1</j-menu-item>
    <j-menu-item>Menu Item 2</j-menu-item>
    <j-menu-item>Menu Item 3</j-menu-item>
  </j-menu-group>
</j-menu>
```

### Collapsible <Badge type="info" text="boolean" />

Use the collapsible property to allow users to collapse and expand the menu group. When the value is set to true, a collapse/expand toggle will be displayed.

<j-menu>
  <j-menu-group collapsible title="Menu Group Title">
    <j-menu-item>Menu Item 1</j-menu-item>
    <j-menu-item>Menu Item 2</j-menu-item>
    <j-menu-item>Menu Item 3</j-menu-item>
  </j-menu-group>
  <j-menu-group collapsible title="Menu Group Title">
    <j-menu-item>Menu Item 1</j-menu-item>
    <j-menu-item>Menu Item 2</j-menu-item>
    <j-menu-item>Menu Item 3</j-menu-item>
  </j-menu-group>
</j-menu>

```html
<j-menu>
  <j-menu-group collapsible title="Menu Group Title">
    <j-menu-item>Menu Item 1</j-menu-item>
    <j-menu-item>Menu Item 2</j-menu-item>
    <j-menu-item>Menu Item 3</j-menu-item>
  </j-menu-group>
  <j-menu-group collapsible title="Menu Group Title">
    <j-menu-item>Menu Item 1</j-menu-item>
    <j-menu-item>Menu Item 2</j-menu-item>
    <j-menu-item>Menu Item 3</j-menu-item>
  </j-menu-group>
</j-menu>
```

### Open <Badge type="info" text="boolean" />

Use the `open` property to set the initial state of the menu group. When the value
is set to true, the menu group will be open by default. You will also need to use to `collapsible` property.

<j-menu>
  <j-menu-group collapsible open title="Menu Group Title">
    <j-menu-item>Menu Item 1</j-menu-item>
    <j-menu-item>Menu Item 2</j-menu-item>
    <j-menu-item>Menu Item 3</j-menu-item>
  </j-menu-group>
</j-menu>

```html
<j-menu>
  <j-menu-group collapsible open title="Menu Group Title">
    <j-menu-item>Menu Item 1</j-menu-item>
    <j-menu-item>Menu Item 2</j-menu-item>
    <j-menu-item>Menu Item 3</j-menu-item>
  </j-menu-group>
</j-menu>
```

## Events

### Toggle

The toggle event is fired when the menu group is collapsed or expanded. You can add an event listener to the menu group element to handle this event, like so:

```js
const menuGroup = document.querySelector("j-menu-group");
menuGroup.addEventListener("toggle", (event) => {
  // Do something when the menu group is toggled
});
```

## Slots

### Start

Use the start slot to add content before the menu items.

<j-menu>
  <j-menu-group title="Menu Group Title">
    <j-icon slot="start" name="person"></j-icon>
    <j-menu-item>Menu Item 1</j-menu-item>
    <j-menu-item>Menu Item 2</j-menu-item>
    <j-menu-item>Menu Item 3</j-menu-item>
  </j-menu-group>
</j-menu>

```html
<j-menu>
  <j-menu-group open title="Menu Group Title">
    <j-icon slot="start" name="person"></j-icon>
    <j-menu-item>Menu Item 1</j-menu-item>
    <j-menu-item>Menu Item 2</j-menu-item>
    <j-menu-item>Menu Item 3</j-menu-item>
  </j-menu-group>
</j-menu>
```

### End

Use the end slot to add content after the menu items.

<j-menu>
  <j-menu-group  open title="Menu Group Title">
    <j-icon slot="end" name="person"></j-icon>
    <j-menu-item>Menu Item 1</j-menu-item>
    <j-menu-item>Menu Item 2</j-menu-item>
    <j-menu-item>Menu Item 3</j-menu-item>
  </j-menu-group>
</j-menu>

```html
<j-menu>
  <j-menu-group collapsible open title="Menu Group Title">
    <j-icon slot="end" name="person"></j-icon>
    <j-menu-item>Menu Item 1</j-menu-item>
    <j-menu-item>Menu Item 2</j-menu-item>
    <j-menu-item>Menu Item 3</j-menu-item>
  </j-menu-group>
</j-menu>
```
