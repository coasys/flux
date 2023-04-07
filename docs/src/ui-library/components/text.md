---
outline: deep
---

# Text

The `j-text` component is used to display text in a variety of styles and formats.

## Usage

Use the `j-text` component to display text in various styles and formats.

<j-text color="success-500" weight="500" size="700">Text content</j-text>

```html
<j-text color="ui-800" weight="500" size="700">Text content</j-text>
```

## Properties

### Variant <Badge type="info" text="string" />

Use the `variant` property to set the visual style of the text. Possible values include:

- `heading-lg`: Used for large headings.
- `heading`: Used for headings.
- `heading-sm`: Used for small headings.
- `subheading`: Used for subheadings.
- `body`: Used for body text.
- `label`: Used for labels.
- `footnote`: Used for footnotes.

<j-text variant="heading-lg">Large Heading</j-text>

```html
<j-text variant="heading-lg">Large Heading</j-text>
```

### Size <Badge type="info" text="number" />

Use the `size` property to set the size of the text. Possible values range from 100 (smallest) to 900 (largest).

<j-text size="700">Medium-sized Text</j-text>

```html
<j-text size="700">Medium-sized Text</j-text>
```

### Tag <Badge type="info" text="string" />

Use the `tag` property to specify the HTML tag used to render the text. This is useful for SEO and accessibility purposes.

<j-text tag="h1">Heading 1</j-text>

```html
<j-text tag="h1">Heading 1</j-text>
```

### Nomargin <Badge type="info" text="boolean" />

Use the `nomargin` property to remove any bottom margin around the text.

<j-text nomargin>No Margin</j-text>

```html
<j-text nomargin>No Margin</j-text>
```

### Inline <Badge type="info" text="boolean" />

Use the `inline` property to display the text inline with other elements.

This is particularly useful for labels and small snippets of text.

<j-text inline>Inline Text</j-text>
<j-text inline>Inline Text</j-text>

```html
<j-text inline>Inline Text</j-text> <j-text inline>Inline Text</j-text>
```

### Uppercase <Badge type="info" text="boolean" />

Use the `uppercase` property to convert the text to uppercase.

<j-text uppercase>Uppercase Text</j-text>

```html
<j-text uppercase>Uppercase Text</j-text>
```

### Color <Badge type="info" text="string" />

The `color` property changes to font color of the text.
You can use any of the [color variables](/ui-library/getting-started/variables.html#colors) defined in the of the documentation

<j-text color="danger-500">Red Text</j-text>

```html
<j-text color="danger-500">Red Text</j-text>
```

### Weight <Badge type="info" text="string" />

Use the `weight` property to set the font weight of the text.

Possible values include normal, bold, and lighter.

<j-text weight="bolder">Bold Text</j-text>

```html
<j-text weight="bolder">Bold Text</j-text>
```
