---
outline: deep
---

# Button

Button component is used to trigger an action or event, such as submitting a form, opening a Dialog, canceling an action, or performing a delete operation.

## Usage

<j-button variant="primary">Button</j-button>

```html
<j-button variant="primary">Button</j-button>
```

## Properties

### Variant <Badge type="info" text="string" />

Use the `variant` property to change the visual style of the button. You can set the value to `primary`, `secondary`, `link`, `subtle` or `ghost`.

<j-button variant="primary">Primary</j-button>
<j-button variant="secondary">Secondary</j-button>
<j-button variant="link">Link</j-button>
<j-button variant="subtle">Subtle</j-button>
<j-button variant="ghost">Ghost</j-button>

```html
<j-button variant="primary">Primary</j-button>
<j-button variant="secondary">Secondary</j-button>
<j-button variant="link">Link</j-button>
<j-button variant="ghost">Ghost</j-button>
<j-button variant="subtle">Subtle</j-button>
```

### Size <Badge type="info" text="boolean" />

Use the `size` property to change the size of the button. You can set the value to `xs`, `sm`, `md`, or `lg`.

<j-button size="xs">Extra small</j-button>
<j-button size="sm">Small</j-button>
<j-button size="md">Medium</j-button>
<j-button size="lg">Large</j-button>
<j-button size="xl">Extra large</j-button>

```html
<j-button size="xs">Extra small</j-button>
<j-button size="sm">Small</j-button>
<j-button size="md">Medium</j-button>
<j-button size="lg">Large</j-button>
<j-button size="xl">Extra large</j-button>
```

### Disabled <Badge type="info" text="boolean" />

Use the `disabled` property to disable the button. When the button is disabled, it cannot be clicked or focused.

<j-button disabled>Disabled</j-button>

```html
<j-button disabled>Disabled</j-button>
```

### Loading <Badge type="info" text="boolean" />

Use the `loading` property to indicate that the button is in a loading state. This is often used when the button triggers an action that takes some time to complete, such as submitting a form or performing an AJAX request.

<j-button loading>Loading</j-button>

```html
<j-button loading>Loading</j-button>
```

### Full <Badge type="info" text="boolean" />

Use the `full` property to make the button take up the full width of its container.

<j-button full>Full</j-button>

```html
<j-button full>Full</j-button>
```

### Square <Badge type="info" text="boolean" />

Use the `square` property to make the button have be equal in height and width.

<j-button square><j-icon name="trash"></j-icon></j-button>

```html
<j-button square><j-icon name="trash"></j-icon></j-button>
```

### Circle <Badge type="info" text="boolean" />

Use the `circle` property to make the button circular. When the circle property is used, the button's width and height will be set to the same value, and the border-radius will be set to 50%.

<j-button circle><j-icon name="trash"></j-icon></j-button>

```html
<j-button circle><j-icon name="trash"></j-icon></j-button>
```

## Events

### Click

The `click` event is fired when the button is clicked. You can add an event listener to the button element to handle this event, like so:

```js
const button = document.querySelector("j-button");
button.addEventListener("click", () => {
  // Do something when the button is clicked
});
```

## Slots

### Start

Use the `start` slot to add content to the start of the button. You can use this slot to add an icon, text, or any other content you want to appear at the start of the button.

<j-button>
    <j-icon slot="start" size="xs" name="chevron-left"></j-icon>
    Start slot
</j-button>

```html
<j-button>
  <j-icon slot="start" size="xs" name="chevron-left"></j-icon>
  Start slot
</j-button>
```

### End

Use the `end` slot to add content to the end of the button. You can use this slot to add an icon, text, or any other content you want to appear at the end of the button.

<j-button>
    <j-icon slot="end" size="xs" name="chevron-left"></j-icon>
    End slot
</j-button>

```html
<j-button>
  <j-icon slot="end" size="xs" name="chevron-left"></j-icon>
  End slot
</j-button>
```
