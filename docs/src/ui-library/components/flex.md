---
outline: deep
---

# Flex

The `j-flex` component is used to create flexible container elements that allow for easy layout of content.

## Usage

<j-flex j="center" a="center" wrap gap="500" direction="row">
  <j-box p="500" bg="ui-300">Item 1</j-box>
  <j-box p="500" bg="ui-300">Item 2</j-box>
  <j-box p="500" bg="ui-300">Item 3</j-box>
</j-flex>

```html
<j-flex j="center" a="center" wrap gap="500" direction="row">
  <j-box p="500" bg="ui-300">Item 1</j-box>
  <j-box p="500" bg="ui-300">Item 2</j-box>
  <j-box p="500" bg="ui-300">Item 3</j-box>
</j-flex>
```

## Properties

### j <Badge type="info" text="string" />

Use the `j` property to align the items along the main axis of the container. You can set the value to `center`, `start`, or `end`.

<j-flex j="start">
  <j-box p="500" bg="ui-300">Start</j-box>
</j-flex>

<j-flex j="center">
  <j-box p="500" bg="ui-300">Center</j-box>
</j-flex>

<j-flex j="end">
  <j-box p="500" bg="ui-300">End</j-box>
</j-flex>

```html
<j-flex j="start">
  <j-box p="500" bg="ui-300">Start</j-box>
</j-flex>

<j-flex j="center">
  <j-box p="500" bg="ui-300">Center</j-box>
</j-flex>

<j-flex j="end">
  <j-box p="500" bg="ui-300">End</j-box>
</j-flex>
```

### a <Badge type="info" text="string" />

Use the `a` property to align the items along the cross axis of the container. You can set the value to `center`, `start`, or `end`.

<j-flex a="center">
  <j-box p="500" bg="ui-300">Center</j-box>
</j-flex>

<j-flex a="start">
  <j-box p="500" bg="ui-300">Start</j-box>
</j-flex>

<j-flex a="end">
  <j-box p="500" bg="ui-300">End</j-box>
</j-flex>

```html
<j-flex a="center">
  <j-box p="500" bg="ui-300">Center</j-box>
</j-flex>

<j-flex a="start">
  <j-box p="500" bg="ui-300">Start</j-box>
</j-flex>

<j-flex a="end">
  <j-box p="500" bg="ui-300">End</j-box>
</j-flex>
```

### wrap <Badge type="info" text="boolean" />

Use the `wrap` property to allow items to wrap to the next line if they exceed the
width of the container.

<j-flex wrap>
    <j-box p="500" bg="ui-300">Element 1</j-box>
    <j-box p="500" bg="ui-300">Element 2</j-box>
    <j-box p="500" bg="ui-300">Element 3</j-box>
    <j-box p="500" bg="ui-300">Element 4</j-box>
    <j-box p="500" bg="ui-300">Element 5</j-box>
    <j-box p="500" bg="ui-300">Element 6</j-box>
</j-flex>

```html
<j-flex wrap>
  <j-box p="500" bg="ui-300">Element 1</j-box>
  <j-box p="500" bg="ui-300">Element 2</j-box>
  <j-box p="500" bg="ui-300">Element 3</j-box>
  <j-box p="500" bg="ui-300">Element 4</j-box>
  <j-box p="500" bg="ui-300">Element 5</j-box>
  <j-box p="500" bg="ui-300">Element 6</j-box>
</j-flex>
```

### gap <Badge type="info" text="number" />

Use the `gap` property to set the amount of space between the items in the
container. You can set the value to a number between 100 and 900.

<j-flex gap="500">
  <j-box p="500" bg="ui-500">Element 1</j-box>
  <j-box p="500" bg="ui-500">Element 2</j-box>
</j-flex>

```html
<j-flex gap="500">
  <j-box p="500" bg="ui-500">Element 1</j-box>
  <j-box p="500" bg="ui-500">Element 2</j-box>
</j-flex>
```

### direction <Badge type="info" text="string" />

Use the `direction` property to set the direction of the items in the container.
You can set the value to `row`, `row-reverse`, `column`, or `column-reverse`.

<j-flex direction="row-reverse">
  <j-box p="500" bg="ui-300">Element 1</j-box>
  <j-box p="500" bg="ui-300">Element 2</j-box>
  <j-box p="500" bg="ui-300">Element 3</j-box>
</j-flex>

```html
<j-flex direction="row-reverse">
  <j-box p="500" bg="ui-300">Element 1</j-box>
  <j-box p="500" bg="ui-300">Element 2</j-box>
  <j-box p="500" bg="ui-300">Element 3</j-box>
</j-flex>
```
