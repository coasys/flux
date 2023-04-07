---
outline: deep
---

# Tabs

The `j-tabs` component displays a collection of tabs that can be used to navigate between different views.

## Usage

::: code-group

```html [html]
<j-tabs value="tab1">
  <j-tab-item value="tab1">Tab 1</j-tab-item>
  <j-tab-item value="tab2">Tab 2</j-tab-item>
  <j-tab-item value="tab3">Tab 3</j-tab-item>
</j-tabs>

<script>
  const tabs = document.querySelector("j-tabs");
  tabs.addEventListener("change", (e) => {
    console.log("selected tab is:", e.target.value);
  });
</script>
```

```js [preact]
export default function Tabs() {
  const [tab, setTab] = useState("tab1");

  return (
    <j-tabs onChange={(e) => setTab(e.target.value)} value={tab}>
      <j-tab-item value="tab1">Tab 1</j-tab-item>
      <j-tab-item value="tab2">Tab 2</j-tab-item>
      <j-tab-item value="tab3">Tab 3</j-tab-item>
    </j-tabs>
  );
}
```

```vue [vue]
<template>
  <j-tabs @change="(e) => (tab = e.target.value)" :value="tab">
    <j-tab-item value="tab1">Tab 1</j-tab-item>
    <j-tab-item value="tab2">Tab 2</j-tab-item>
    <j-tab-item value="tab3">Tab 3</j-tab-item>
  </j-tabs>
</template>

<script setup>
import { ref } from "vue";
const tab = ref("tab1");
</script>
```

:::

## Properties

### Value <Badge type="info" text="any" />

Use the `value` property to set the currently active tab. The value should match the value of the `j-tab-item` element that should be active.

<j-tabs value="tab2">
  <j-tab-item value="tab1">Tab 1</j-tab-item>
  <j-tab-item value="tab2">Tab 2</j-tab-item>
  <j-tab-item value="tab3">Tab 3</j-tab-item>
</j-tabs>

```html
<j-tabs value="tab2">
  <j-tab-item value="tab1">Tab 1</j-tab-item>
  <j-tab-item value="tab2">Tab 2</j-tab-item>
  <j-tab-item value="tab3">Tab 3</j-tab-item>
</j-tabs>
```

### Vertical <Badge type="info" text="boolean" />

Use the vertical property to display the tabs vertically.

<j-tabs vertical>
  <j-tab-item value="tab1">Tab 1</j-tab-item>
  <j-tab-item value="tab2">Tab 2</j-tab-item>
  <j-tab-item value="tab3">Tab 3</j-tab-item>
</j-tabs>

```html
<j-tabs vertical>
  <j-tab-item value="tab1">Tab 1</j-tab-item>
  <j-tab-item value="tab2">Tab 2</j-tab-item>
  <j-tab-item value="tab3">Tab 3</j-tab-item>
</j-tabs>
```

### Full <Badge type="info" text="boolean" />

Use the full property to make the tabs span the full width of the container.

<j-tabs full>
  <j-tab-item value="tab1">Tab 1</j-tab-item>
  <j-tab-item value="tab2">Tab 2</j-tab-item>
  <j-tab-item value="tab3">Tab 3</j-tab-item>
</j-tabs>

```html
<j-tabs full>
  <j-tab-item value="tab1">Tab 1</j-tab-item>
  <j-tab-item value="tab2">Tab 2</j-tab-item>
  <j-tab-item value="tab3">Tab 3</j-tab-item>
</j-tabs>
```

### Variant <Badge type="info" text="string" />

Use the variant property to change the visual style of the tabs. You can set the value to `button`.

<j-tabs variant="button" value="tab1" >
  <j-tab-item value="tab1">Tab 1</j-tab-item>
  <j-tab-item value="tab2">Tab 2</j-tab-item>
  <j-tab-item value="tab3">Tab 3</j-tab-item>
</j-tabs>

```html
<j-tabs variant="button" value="tab1">
  <j-tab-item value="tab1">Tab 1</j-tab-item>
  <j-tab-item value="tab2">Tab 2</j-tab-item>
  <j-tab-item value="tab3">Tab 3</j-tab-item>
</j-tabs>
```

### Size <Badge type="info" text="string" />

Use the size property to change the size of the tabs. You can set the value to `sm` or `lg`.

<j-tabs size="sm" full value="tab1" >
  <j-tab-item value="tab1">Tab 1</j-tab-item>
  <j-tab-item value="tab2">Tab 2</j-tab-item>
  <j-tab-item value="tab3">Tab 3</j-tab-item>
</j-tabs>

<j-tabs size="lg" full value="tab1" >
  <j-tab-item value="tab1">Tab 1</j-tab-item>
  <j-tab-item value="tab2">Tab 2</j-tab-item>
  <j-tab-item value="tab3">Tab 3</j-tab-item>
</j-tabs>

```html
<j-tabs size="sm" full value="tab1">
  <j-tab-item value="tab1">Tab 1</j-tab-item>
  <j-tab-item value="tab2">Tab 2</j-tab-item>
  <j-tab-item value="tab3">Tab 3</j-tab-item>
</j-tabs>

<j-tabs size="lg" full value="tab1">
  <j-tab-item value="tab1">Tab 1</j-tab-item>
  <j-tab-item value="tab2">Tab 2</j-tab-item>
  <j-tab-item value="tab3">Tab 3</j-tab-item>
</j-tabs>
```

## Events

### Change

The change event is fired when the active tab is changed. You can add an event listener to the j-tabs element to handle this event, like so:

```js
const tabs = document.querySelector("j-tabs");
tabs.addEventListener("change", (event) => {
  // Do something when the active tab is changed
});
```
