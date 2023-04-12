---
outline: deep
---

# Tooltip

Tooltip component is used to provide additional information or context about an element.

## Usage

<j-tooltip placement="top" title="Title of the tooltip">
  <j-button>Hover me!</j-button>
</j-tooltip>

```html
<j-tooltip placement="top" title="Title of the tooltip">
  <j-button>Hover me!</j-button>
</j-tooltip>
```

## Properties

### Title <Badge type="info" text="string" />

Use the `title` property to set the text displayed in the tooltip.

<j-tooltip title="Title of the tooltip">
  <j-button>Hover me!</j-button>
</j-tooltip>

```html
<j-tooltip title="Title of the tooltip">
  <j-button>Hover me!</j-button>
</j-tooltip>
```

### Open <Badge type="info" text="boolean" />

Use the `open` property to set the visibility state of the tooltip. When the value is set to true, the tooltip will be visible by default.

<j-tooltip title="Here is some info" open>
  <j-button>Hover me!</j-button>
</j-tooltip>

```html
<j-tooltip title="Here is some info" open>
  <j-button>Hover me!</j-button>
</j-tooltip>
```

### Placement <Badge type="info" text="string" />

Use the `placement` property to set the position of the tooltip relative to the element it's attached to. You can set the value to `auto`,`auto-start`,`auto-end`,`top`,`top-start`,`top-end`,`bottom`,`bottom-start`,`bottom-end`,`right`,`right-start`,`right-end`,`left`,`left-start` and`left-end`

<j-tooltip title="Top" placement="top">
  <j-button>Hover me!</j-button>
</j-tooltip>

```html
<j-tooltip title="Top" placement="top">
  <j-button>Hover me!</j-button>
</j-tooltip>
```

## Events

### Toggle

The `toggle` event is fired when the visibility state of the tooltip changes. You can add an event listener to the tooltip element to handle this event, like so:```

```js
const tooltip = document.querySelector("j-tooltip");
tooltip.addEventListener("toggle", () => {
  // Do something when the tooltip visibility state changes
});
```

## Slots

### Title

The `title` slot makes it possible to add HTML inside of the tooltip:

<j-tooltip title="Title of the tooltip">
  <j-flex gap="300" slot="title">
    <j-icon size="sm" color="danger-500" name="exclamation-triangle"></j-icon>
    <j-text color="danger-500" size="500" weight="600" nomargin>Warning!</j-text>
  </j-flex>
  <j-button>Hover me!</j-button>
</j-tooltip>

```html
<j-tooltip title="Title of the tooltip">
  <j-flex gap="500" slot="title">
    <j-icon name="exclamation-triangle"></j-icon>
    <j-text nomargin>Hello</j-text>
  </j-flex>
  <j-button>Hover me!</j-button>
</j-tooltip>
```
