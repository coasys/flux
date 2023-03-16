---
outline: deep
---

# Avatar

Avatar component is used to display a profile picture, an icon, or an initial letter of a user's name.

## Properties

### Src <Badge type="info" text="string" />

Use the src property to set the source of the avatar image. This property takes priority over the hash property.

<j-avatar src="https://i.pravatar.cc/300"></j-avatar>

```html
<j-avatar src="https://i.pravatar.cc/300"></j-avatar>
```

### Hash <Badge type="info" text="string" />

Use the hash property to generate a unique avatar based on the provided hash value. If the src property is also provided, the src value will take precedence.

<j-avatar hash="abc123"></j-avatar>

```html
<j-avatar hash="abc123"></j-avatar>
```

### Size <Badge type="info" text="string" />

Use the size property to change the size of the avatar. You can set the value to xs, sm, md, or lg.

<j-avatar src="https://i.pravatar.cc/300" size="sm"></j-avatar>
<j-avatar src="https://i.pravatar.cc/300" size="md"></j-avatar>
<j-avatar src="https://i.pravatar.cc/300" size="lg"></j-avatar>

```html
<j-avatar src="https://i.pravatar.cc/300" size="sm"></j-avatar>
<j-avatar src="https://i.pravatar.cc/300" size="md"></j-avatar>
<j-avatar src="https://i.pravatar.cc/300" size="lg"></j-avatar>
```

### Selected <Badge type="info" text="boolean" />

Use the selected property to indicate that the user is currently selected or active.

<j-avatar src="https://i.pravatar.cc/300" selected></j-avatar>

```html
<j-avatar src="https://i.pravatar.cc/300" selected></j-avatar>
```

### Online <Badge type="info" text="boolean" />

Use the online property to indicate that the user is currently online or active.

<j-avatar src="https://i.pravatar.cc/300" online></j-avatar>

```html
<j-avatar src="https://i.pravatar.cc/300" online></j-avatar>
```

### Initials <Badge type="info" text="boolean" />

Use the initials property to display the user's initials if no src or hash properties are provided.

<j-avatar initials="AB"></j-avatar>

```html
<j-avatar initials="AB"></j-avatar>
```

### Icon <Badge type="info" text="string" />

Use the icon property to display an icon instead of an image.

<j-avatar icon="person"></j-avatar>

```html
<j-avatar icon="person"></j-avatar>
```
