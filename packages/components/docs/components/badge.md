---
outline: deep
---

# Badge

The j-badge component is used to display a small notification badge.

## Usage

<j-badge variant="primary" size="md">New</j-badge>

```html
<j-badge variant="primary" size="md">New</j-badge>
```

## Properties

### Variant <Badge type="info" text="string" />

Use the variant property to set the color of the badge. Available options include primary, secondary, success, warning, danger, and info.

<j-badge variant="primary">Primary</j-badge>
<j-badge variant="secondary">Secondary</j-badge>
<j-badge variant="success">Success</j-badge>
<j-badge variant="warning">Warning</j-badge>
<j-badge variant="danger">Danger</j-badge>

```html
<j-badge variant="primary">Primary</j-badge>
<j-badge variant="secondary">Secondary</j-badge>
<j-badge variant="success">Success</j-badge>
<j-badge variant="warning">Warning</j-badge>
<j-badge variant="danger">Danger</j-badge>
```

### Size <Badge type="info" text="string" />

Use the size property to set the size of the badge. Available options include `sm`, `md`, and `lg`.

<j-badge variant="primary" size="sm">Small</j-badge>
<j-badge variant="primary" size="md">Medium</j-badge>
<j-badge variant="primary" size="lg">Large</j-badge>

```html
<j-badge size="sm">Small</j-badge>
<j-badge size="md">Medium</j-badge>
<j-badge size="lg">Large</j-badge>
```

## Slots

The j-badge component does not have any slots.
