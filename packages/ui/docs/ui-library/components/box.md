---
outline: deep
---

# Box

The `j-box` component is a general purpose element with properties to control spacing, background color and other styling based on Flux UI's CSS variables.

## Usage

<j-box p="500" radius="md" bg="ui-400">Box content</j-box>

```html
<j-box p="500" radius="md" bg="ui-400">Box content</j-box>
```

## Properties

## Background

The `bg` property changes to background color of the box.
You can use any of the [color variables](/ui-library/getting-started/variables.html#colors) defined in the of the documentation

<j-box bg="primary-500">Hello</j-box>

```html
<j-box bg="primary-500">Hello</j-box>
```

## Border Radius

The `radius` property changes to border-radius of the box.
The possible sizes are `sm`, `md` and `lg`.

<j-box bg="ui-200" p="500" radius="md">Hello</j-box>

```html
<j-box bg="ui-200" p="500" radius="md">Hello</j-box>
```

### Padding

The `j-box` component has several padding properties to add padding to the box:

- `p`: Padding to all sides
- `px`: Left and right padding
- `py`: Top and bottom padding
- `pt`: Top padding
- `pb`: Bottom padding
- `pl`: Left padding

Each prop takes a value from `100` to `900`

<j-box bg="ui-200" p="500">Hello</j-box>

```html
<j-box bg="ui-200" p="500">Hello</j-box>
```

### Margin

Margin to the `j-box` component can be added using one of these props:

- `m`: Margin to all sides
- `mx`: Left and right margin
- `my`: Top and bottom margin
- `mt`: Top margin
- `mb`: Bottom margin
- `ml`: Left margin

Each prop takes a value from `100` to `900`

<j-box bg="ui-200" ml="900">Hello</j-box>

```html
<j-box bg="ui-200" ml="900">Hello</j-box>
```
