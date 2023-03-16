---
outline: deep
---

# Menu

The j-menu component is a navigation menu that displays a list of options for the user to choose from.

## Usage

<j-menu>
<j-menu-item>Menu item 1</j-menu-item>
<j-menu-item>Menu item 2</j-menu-item>
<j-menu-item>Menu item 3</j-menu-item>
</j-menu>

```html
<j-menu>
  <j-menu-item>Menu item 1</j-menu-item>
  <j-menu-item>Menu item 2</j-menu-item>
  <j-menu-item>Menu item 3</j-menu-item>
</j-menu>
```

## Properties

### Selected <Badge type="info" text="boolean" />

Use the selected property to set the state of the menu item. When the value is set to true, the menu item will be selected.

<j-menu>
  <j-menu-item selected>Selected</j-menu-item>
  <j-menu-item>Not selected</j-menu-item>
  <j-menu-item>Not selected</j-menu-item>
</j-menu>

```html
<j-menu>
  <j-menu-item selected>Selected</j-menu-item>
  <j-menu-item>Not selected</j-menu-item>
  <j-menu-item>Not selected</j-menu-item>
</j-menu>
```

### Active <Badge type="info" text="boolean" />

Use the active property to set the state of the menu item. When the value is set to true, the menu item will be active.

<j-menu>
  <j-menu-item active>Active</j-menu-item>
  <j-menu-item>Not active</j-menu-item>
  <j-menu-item>Not active</j-menu-item>
</j-menu>

```html
<j-menu>
  <j-menu-item active>Active</j-menu-item>
  <j-menu-item>Not active</j-menu-item>
  <j-menu-item>Not active</j-menu-item>
</j-menu>
```

### Value <Badge type="info" text="any" />

Use the value property to set the value of the menu item. This value will be used when the menu item is selected.

<j-menu>
    <j-menu-item value="menu-item-value">Menu Item Value</j-menu-item>
</j-menu>

```html
<j-menu>
  <j-menu-item value="menu-item-value">Menu Item Value</j-menu-item>
</j-menu>
```

## Events

### Click

The click event is fired when the menu item is clicked. You can add an event listener to the menu item element to handle this event, like so:

```js
const menuItem = document.querySelector("j-menu-item");
menuItem.addEventListener("click", () => {
  // Do something when the menu item is clicked
});
```

## Slots

### Start

Use the icon slot to customize the icon displayed in the menu item. You can use this slot to replace the default icon with a custom icon or text.

<j-menu-item>
  <j-icon slot="icon" name="menu"></j-icon>
  Icon slot
</j-menu-item>

```html
<j-menu-item>
  <j-icon slot="icon" name="menu"></j-icon>
  Icon slot
</j-menu-item>
```

### End
