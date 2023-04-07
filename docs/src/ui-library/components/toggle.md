---
outline: deep
---

# Toggle

Toggle component is used to enable users to switch between two states.

## Usage

<j-toggle>Checked</j-toggle>

::: code-group

```html [html]
<j-toggle>Checked</j-toggle>
<script>
  const toggle = document.querySelector("j-toggle");
  toggle.addEventListener("change", (e) => {
    console.log(e.target.checked);
  });
</script>
```

```js [preact]
export default function Toggle() {
  const [checked, setChecked] = useState(false);

  return (
    <j-toggle
      checked={checked}
      onChange={(e) => setChecked(e.target.checked)}
    ></j-toggle>
  );
}
```

```vue [vue]
<template>
  <j-toggle
    :checked="checked"
    @change="(e) => (checked = e.target.checked)"
  ></j-toggle>
</template>

<script setup>
import { ref } from "vue";
const checked = ref(false);
</script>
```

:::

## Properties

### Checked <Badge type="info" text="boolean" />

Use the checked property to set the state of the toggle. When the value is set to true, the toggle will be in the "on" state.

<j-toggle checked>Checked</j-toggle>

```html
<j-toggle checked>Checked</j-toggle>
```

### Disabled <Badge type="info" text="boolean" />

Use the disabled property to disable the toggle. When the toggle is disabled, it cannot be clicked or focused.

<j-toggle disabled>Disabled</j-toggle>

```html
<j-toggle disabled>Disabled</j-toggle>
```

### Full <Badge type="info" text="boolean" />

Use the full property to make the toggle take up the full width of its container.

<j-toggle full>Full</j-toggle>

```html
<j-toggle full>Full</j-toggle>
```

### Size <Badge type="info" text="string" />

Use the size property to change the size of the toggle. You can set the value to sm, md, or lg.

<j-toggle size="sm">Small</j-toggle>
<j-toggle size="md">Medium</j-toggle>
<j-toggle size="lg">Large</j-toggle>

```html
<j-toggle size="sm">Small</j-toggle>
<j-toggle size="md">Medium</j-toggle>
<j-toggle size="lg">Large</j-toggle>
```

### Value <Badge type="info" text="any" />

Use the value property to set the value of the toggle. This value will be used when the form containing the toggle is submitted.

<j-toggle value="toggle-value">Value</j-toggle>

```html
<j-toggle value="toggle-value">Value</j-toggle>
```

## Events

### Change

The change event is fired when the toggle is clicked and its state changes. You can add an event listener to the toggle element to handle this event, like so:

```js
const toggle = document.querySelector("j-toggle");
toggle.addEventListener("change", () => {
  // Do something when the toggle state changes
});
```

## Slots

This component doesn't have any slots available.
