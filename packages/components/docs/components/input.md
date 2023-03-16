---
outline: deep
---

# Input

Input component is used to get user input in forms. It can be used to get text, numbers, dates, and other types of input from the user.

## Properties

### Value <Badge type="info" text="string" />

Use the value property to set or get the current value of the input. You can use this property to set an initial value for the input, or to get the current value of the input when the user submits the form.

<j-input value="Initial value"></j-input>

```html
<j-input value="Initial value"></j-input>
```

### Pattern <Badge type="info" text="string" />

Use the pattern property to set a regular expression that the input's value must match. You can use this property to validate the user's input and display an error message if the input does not match the specified pattern.

<j-input pattern="[A-Za-z]+" autovalidate error-text="Please enter only letters"></j-input>

```html
<j-input
  pattern="[A-Za-z]+"
  autovalidate
  errortext="Please enter only letters"
></j-input>
```

### Label <Badge type="info" text="string" />

Use the label property to set the label for the input. The label will be displayed above the input, and it can help users understand what kind of input is required.

<j-input label="Name"></j-input>

```html
<j-input label="Name"></j-input>
```

### Size <Badge type="info" text="string" />

Use the size property to set the size of the input. You can set the value to `sm`, `md`, `lg`, or `xl`.

<j-input placeholder="Small" size="sm"></j-input>
<br/>
<j-input placeholder="Medium" size="md"></j-input>
<br/>
<j-input placeholder="Large" size="lg"></j-input>
<br/>
<j-input placeholder="Extra large" size="xl"></j-input>

```html
<j-input placeholder="Small" size="sm"></j-input>
<j-input placeholder="Medium" size="md"></j-input>
<j-input placeholder="Large" size="lg"></j-input>
<j-input placeholder="Extra large" size="xl"></j-input>
```

### Placeholder <Badge type="info" text="string" />

Use the placeholder property to set the placeholder text for the input. The placeholder text will be displayed inside the input, and it can help users understand what kind of input is expected.

<j-input placeholder="Enter your email"></j-input>

```html
<j-input placeholder="Enter your email"></j-input>
```

### ErrorText <Badge type="info" text="string" />

Use the error-text property to set the error message that should be displayed if the user's input is not valid.

<j-input pattern="[A-Za-z]+" errortext="Please enter only letters"></j-input>

```html
<j-input pattern="[A-Za-z]+" errortext="Please enter only letters"></j-input>
```

### HelpText <Badge type="info" text="string" />

Use the help-text property to set a brief message that can help users understand what kind of input is expected.

<j-input helptext="Please enter your email address"></j-input>

```html
<j-input helptext="Please enter your email address"></j-input>
```

### Autocomplete <Badge type="info" text="string" />

Use the autocomplete property to enable or disable autocomplete for the input. You can set the value to on or off.

<j-input autocomplete="off"></j-input>

```html
<j-input autocomplete="off"></j-input>
```

### Autovalidate <Badge type="info" text="boolean" />

Use the autovalidate property to enable or disable automatic validation of the input. If this property is set to true, the input will be validated automatically whenever the user types or pastes something into it.

<j-input autovalidate></j-input>

```html
<j-input autovalidate></j-input>
```

### Autofocus <Badge type="info" text="boolean" />

Use the autofocus property to make the input automatically focused when the page loads.

<j-input autofocus></j-input>

```html
<j-input autofocus></j-input>
```

### Disabled <Badge type="info" text="boolean" />

Use the disabled property to disable the input. When the input is disabled, the user cannot interact with it.

<j-input disabled></j-input>

```html
<j-input disabled></j-input>
```

### Full <Badge type="info" text="boolean" />

Use the full property to make the input take up the full width of its container.

<j-input full></j-input>

```html
<j-input full></j-input>
```

### Error <Badge type="info" text="boolean" />

Use the error property to specify whether the input field is in an error state. You can use this if you want to implement your own validation logic.

<j-input error errortext="Please enter a valid input"></j-input>

```html
<j-input error errortext="Please enter a valid input"></j-input>
```

### Required <Badge type="info" text="boolean" />

Use the required property to specify whether the input field is required.

<j-input required autovalidate></j-input>

```html
<j-input required></j-input>
```

### Readonly <Badge type="info" text="boolean" />

Use the readonly property to specify whether the input field is read-only.

<j-input readonly></j-input>

```html
<j-input readonly></j-input>
```

### Type <Badge type="info" text="string" />

Use the type property to specify the type of input field. This can be `text`, `password`, `number`, `email`, `tel`, `url`, `date`, `datetime`

<j-input type="number"></j-input>

```html
<j-input type="number"></j-input>
```
