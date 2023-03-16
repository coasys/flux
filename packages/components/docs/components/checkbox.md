---
outline: deep
---

# Checkbox

Checkbox component is used to enable users to select one or more items from a group of options.

## Usage

::: code-group

```html [html]
<j-checkbox checked>Checked</j-checkbox>

<script>
  const checkbox = document.querySelector("j-checkbox");
  checkbox.addEventListener("change", (e) => {
    console.log(e.target.checked);
  });
</script>
```

```js [preact]
export default function Checkbox() {
  const [checked, setChecked] = useState(false);

  return (
    <j-checkbox
      checked={checked}
      onChange={(e) => setChecked(e.target.checked)}
    ></j-checkbox>
  );
}
```

```vue [vue]
<template>
  <j-checkbox
    :checked="checked"
    @change="(e) => (checked = e.target.checked)"
  ></j-checkbox>
</template>

<script setup>
import { ref } from "vue";
const checked = ref(false);
</script>
```

:::

## Properties

### Checked <Badge type="info" text="boolean" />

Use the `checked` property to set the state of the checkbox. When the value is set to true, the checkbox will be checked.

<j-checkbox checked>Checked</j-checkbox>

```html
<j-checkbox checked>Checked</j-checkbox>
```

### Disabled <Badge type="info" text="boolean" />

Use the `disabled` property to disable the checkbox. When the checkbox is disabled, it cannot be clicked or focused.

<j-checkbox disabled>Disabled</j-checkbox>

```html
<j-checkbox disabled>Disabled</j-checkbox>
```

### Full <Badge type="info" text="boolean" />

Use the `full` property to make the checkbox take up the full width of its
container.

<j-checkbox full>Full</j-checkbox>

```html
<j-checkbox full>Full</j-checkbox>
```

### Size <Badge type="info" text="string" />

Use the `size` property to change the size of the checkbox. You can set the value
to sm, md, or lg.

<j-checkbox size="sm">Small</j-checkbox>
<j-checkbox size="md">Medium</j-checkbox>
<j-checkbox size="lg">Large</j-checkbox>

```html
<j-checkbox size="sm">Small</j-checkbox>
<j-checkbox size="md">Medium</j-checkbox>
<j-checkbox size="lg">Large</j-checkbox>
```

### Value <Badge type="info" text="any" />

Use the `value` property to set the value of the checkbox. This value will be used
when the form containing the checkbox is submitted.

<j-checkbox value="checkbox-value">Value</j-checkbox>

```html
<j-checkbox value="checkbox-value">Value</j-checkbox>
```

## Events

### Change

The `change` event is fired when the checkbox is clicked
and its state changes. You can add an event listener to the checkbox element to
handle this event, like so:

```js
const checkbox = document.querySelector("j-checkbox");
checkbox.addEventListener("change", () => {
  // Do something when the checkbox state changes
});
```

## Slots

### Checkmark

Use the `checkmark` slot to customize the checkmark icon displayed in the
checkbox. You can use this slot to replace the default checkmark icon with a
custom icon or text.

<j-checkbox>
  <div slot="checkmark">
    <j-icon name="x"></j-icon>
  </div>
  Checkmark slot
</j-checkbox>

```html
<j-checkbox>
  <div slot="checkmark">
    <j-icon name="x"></j-icon>
  </div>
  Checkmark slot
</j-checkbox>
```
