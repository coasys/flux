# Comment Section

A comment section to show comments in your flux plugin

## Features

- Standard RT formatting
- Person tagging with `@`
- Channel tagging with `#`

## How to use

Install the package `npm install --save @coasys/flux-comment-section`.

Define a new web component:

```js
import CommentSection from "@coasys/flux-comment-section";

customElements.define("comment-section", CommentSection);
```

Use it in HTML like this: `<comment-section/>`:

## Props

- `perspective` (required)
- `source` (required)
