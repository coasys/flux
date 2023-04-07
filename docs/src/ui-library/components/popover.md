---
outline: deep
---

# Popover

Popover component is used to display additional content in a small container that appears on top of the main content.

## Usage

<j-popover>
  <j-button variant="primary" slot="trigger">Click me</j-button>
  <j-menu slot="content">
    <j-menu-item>Option 1</j-menu-item>
     <j-menu-item>Option 2</j-menu-item>
  </j-menu>
</j-popover>

```html
<j-popover>
  <j-button variant="primary" slot="trigger">Click me</j-button>
  <j-menu slot="content">
    <j-menu-item>Option 1</j-menu-item>
    <j-menu-item>Option 2</j-menu-item>
  </j-menu>
</j-popover>
```

## Properties

### Placement <Badge type="info" text="string" />

Use the `placement` property to specify where the popover should appear relative to the trigger element. You can set the value to `auto`, `auto-start`, `auto-end`,`top`, `top-start`, `top-end`, `bottom`, `bottom-start`, `bottom-end`, `right`, `right-start`,`right-end`, `left`, `left-start` or `left-end`.

<j-popover placement="bottom">
  <j-button variant="primary" slot="trigger">Click me</j-button>
  <j-menu slot="content">
    <j-menu-item>Option 1</j-menu-item>
    <j-menu-item>Option 2</j-menu-item>
  </j-menu>
</j-popover>

```html
<j-popover placement="bottom">
  <j-button variant="primary" slot="trigger">Click me</j-button>
  <j-menu slot="content">
    <j-menu-item>Option 1</j-menu-item>
    <j-menu-item>Option 2</j-menu-item>
  </j-menu>
</j-popover>
```

### Event <Badge type="info" text="string" />

Use the `event` property to specify the event that should trigger the popover to appear. You can set the value to `click`, `contextmenu` or `mouseover`.

<j-popover event="mouseover">
  <j-button variant="primary" slot="trigger">Hover me</j-button>
  <j-menu slot="content">
    <j-menu-item>Option 1</j-menu-item>
    <j-menu-item>Option 2</j-menu-item>
  </j-menu>
</j-popover>

```html
<j-popover placement="bottom">
  <j-button variant="primary" slot="trigger">Click me</j-button>
  <j-menu slot="content">
    <j-menu-item>Option 1</j-menu-item>
    <j-menu-item>Option 2</j-menu-item>
  </j-menu>
</j-popover>
```

### Open <Badge type="info" text="boolean" />

Use the `open` property to specify the wether the popover is shown or not.

<j-popover open>
  <j-button variant="primary" slot="trigger">Click me</j-button>
  <j-menu slot="content">
    <j-menu-item>Option 1</j-menu-item>
    <j-menu-item>Option 2</j-menu-item>
  </j-menu>
</j-popover>

```html
<j-popover open>
  <j-button variant="primary" slot="trigger">Click me</j-button>
  <j-menu slot="content">
    <j-menu-item>Option 1</j-menu-item>
    <j-menu-item>Option 2</j-menu-item>
  </j-menu>
</j-popover>
```

## Events

### Toggle

The toggle event is fired when the popover is toggled. You can add an event listener to the popover element to handle this event, like so:

```js
const popover = document.querySelector("j-popover");
popover.addEventListener("toggle", () => {
  // Do something when the popover is displayed
});
```

## Slots

### Trigger

Use the trigger slot to customize the trigger element that the user interacts with to show/hide the popover. You can use this slot to replace the default trigger element with a custom element.

<j-popover event="mouseover">
  <j-icon slot="trigger" name="person">Click me</j-icon>
  <j-menu slot="content">
    <j-menu-item>Option 1</j-menu-item>
    <j-menu-item>Option 2</j-menu-item>
  </j-menu>
</j-popover>

```html
<j-popover event="mouseover">
  <j-icon slot="trigger" name="person">Click me</j-icon>
  <j-menu slot="content">
    <j-menu-item>Option 1</j-menu-item>
    <j-menu-item>Option 2</j-menu-item>
  </j-menu>
</j-popover>
```

### Content

Use the content slot to customize the content of the popover. You can use this slot to replace the default content with custom HTML content.

<j-popover>
  <j-button slot="trigger">Click me</j-button>
  <j-box p="300" bg="success-500" slot="content">
    <p>This is custom content for the popover.</p>
  </j-box>
</j-popover>

```html
<j-popover>
  <j-button slot="trigger">Click me</j-button>
  <j-box p="300" bg="success-500" slot="content">
    <p>This is custom content for the popover.</p>
  </j-box>
</j-popover>
```
