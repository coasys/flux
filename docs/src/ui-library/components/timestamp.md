# Timestamp

The j-timestamp component is used to display timestamps in various formats and styles.

## Usage

<j-timestamp value="2023-04-05T12:34:56Z"></j-timestamp>

```html
<j-timestamp value="2023-04-05T12:34:56Z"></j-timestamp>
```

## Properties

value <Badge type="info" text="string" />
Use the value property to set the timestamp value to be displayed. This value should be in ISO format.

<j-timestamp value="2023-04-05T12:34:56Z"></j-timestamp>

```html
<j-timestamp value="2023-04-05T12:34:56Z"></j-timestamp>
```

### locales <Badge type="info" text="string" />

Use the locales property to set the locale to be used when formatting the timestamp.

<j-timestamp value="2023-04-05T12:34:56Z" locales="en-US"></j-timestamp><br />
<j-timestamp value="2023-04-05T12:34:56Z" locales="fr-FR"></j-timestamp>

```html
<j-timestamp value="2023-04-05T12:34:56Z" locales="en-US"></j-timestamp>
<j-timestamp value="2023-04-05T12:34:56Z" locales="fr-FR"></j-timestamp>
```

### relative <Badge type="info" text="boolean" />

Use the relative property to display the timestamp as a relative time (e.g. "5 minutes ago") instead of an absolute time (e.g. "Apr 5, 2023, 12:34 PM").

<j-timestamp value="2023-04-05T12:34:56Z" relative></j-timestamp>

```html
<j-timestamp value="2023-04-05T12:34:56Z" relative></j-timestamp>
```

### dateStyle <Badge type="info" text="string" />

Use the dateStyle property to set the style for the date portion of the timestamp. This property can be set to "full", "long", "medium", or "short".

<j-timestamp value="2023-04-05T12:34:56Z" dateStyle="full"></j-timestamp><br />
<j-timestamp value="2023-04-05T12:34:56Z" dateStyle="long"></j-timestamp><br />
<j-timestamp value="2023-04-05T12:34:56Z" dateStyle="medium"></j-timestamp><br />
<j-timestamp value="2023-04-05T12:34:56Z" dateStyle="short"></j-timestamp>

```html
<j-timestamp value="2023-04-05T12:34:56Z" dateStyle="full"></j-timestamp>
<j-timestamp value="2023-04-05T12:34:56Z" dateStyle="long"></j-timestamp>
<j-timestamp value="2023-04-05T12:34:56Z" dateStyle="medium"></j-timestamp>
<j-timestamp value="2023-04-05T12:34:56Z" dateStyle="short"></j-timestamp>
```

### timeStyle <Badge type="info" text="string" />

Use the timeStyle property to set the style for the time portion of the timestamp. This property can be set to "full", "long", "medium", or "short". The property `dateStyle` is required for `timeStyle` to work.

<j-timestamp value="2023-04-05T12:34:56Z" timeStyle="full"></j-timestamp><br />
<j-timestamp value="2023-04-05T12:34:56Z" timeStyle="long"></j-timestamp><br />
<j-timestamp value="2023-04-05T12:34:56Z" timeStyle="medium"></j-timestamp><br />
<j-timestamp value="2023-04-05T12:34:56Z" timeStyle="short"></j-timestamp>

```html
<j-timestamp value="2023-04-05T12:34:56Z" timeStyle="full"></j-timestamp>
<j-timestamp value="2023-04-05T12:34:56Z" timeStyle="long"></j-timestamp>
<j-timestamp value="2023-04-05T12:34:56Z" timeStyle="medium"></j-timestamp>
<j-timestamp value="2023-04-05T12:34:56Z" timeStyle="short"></j-timestamp>
```

### dayPeriod <Badge type="info" text="string" />

Use the dayPeriod property to set the period of the day (AM/PM) in the formatted timestamp. This property can take the following values: "narrow", "short", or "long".

<j-timestamp dayPeriod="short" value="2023-04-05T12:34:56Z"></j-timestamp>

```html
<j-timestamp dayPeriod="short" value="2023-04-05T12:34:56Z"></j-timestamp>
```

### hourCycle <Badge type="info" text="string" />

Use the hourCycle property to set the hour cycle in the formatted timestamp. This property can take the following values: "h11", "h12", "h23", or "h24".

<j-timestamp timeStyle="short" hourCycle="h24" value="2023-04-05T12:34:56Z"></j-timestamp><br/>
<j-timestamp timeStyle="short" hourCycle="h12" value="2023-04-05T12:34:56Z"></j-timestamp>

```html
<j-timestamp hourCycle="h12" value="2023-04-05T12:34:56Z"></j-timestamp>
<j-timestamp
  timeStyle="short"
  hourCycle="h12"
  value="2023-04-05T12:34:56Z"
></j-timestamp>
```

### timeZone <Badge type="info" text="string" />

Use the timeZone property to set the time zone of the timestamp. This property can take a string value representing a valid time zone name.

<j-timestamp timeStyle="long" timeZone="America/Los_Angeles" value="2023-04-05T12:34:56Z"></j-timestamp>

```html
<j-timestamp
  timeStyle="long"
  timeZone="America/Los_Angeles"
  value="2023-04-05T12:34:56Z"
></j-timestamp>
```

### weekday <Badge type="info" text="string" />

Use the weekday property to display the weekday of the timestamp. This property can take the following values: "narrow", "short", or "long".

<j-timestamp weekday="short" value="2023-04-05T12:34:56Z"></j-timestamp>

```html
<j-timestamp weekday="short" value="2023-04-05T12:34:56Z"></j-timestamp>
```

### era <Badge type="info" text="string" />

Use the era property to display the era of the timestamp. This property can take the following values: "narrow", "short", or "long".

<j-timestamp era="short" value="2023-04-05T12:34:56Z"></j-timestamp>

```html
<j-timestamp era="short" value="2023-04-05T12:34:56Z"></j-timestamp>
```

### year <Badge type="info" text="string" />

Use the year property to display the year of the timestamp. This property can take the following values: "numeric", "2-digit".

<j-timestamp year="numeric" value="2023-04-05T12:34:56Z"></j-timestamp>

```html
<j-timestamp year="numeric" value="2023-04-05T12:34:56Z"></j-timestamp>
```

### month <Badge type="info" text="string" />

Use the month property to display the month of the timestamp. This property can take the following values: "numeric", "2-digit", "narrow", "short", or "long".

<j-timestamp month="long" value="2023-04-05T12:34:56Z"></j-timestamp>

```html
<j-timestamp month="long" value="2023-04-05T12:34:56Z"></j-timestamp>
```

### day <Badge type="info" text="string" />

Use the day property to display the day of the timestamp. This property can take the following values: "numeric", "2-digit".

<j-timestamp day="numeric" value="2023-04-05T12:34:56Z"></j-timestamp>

```html
<j-timestamp day="numeric" value="2023-04-05T12:34:56Z"></j-timestamp>
```

### hour <Badge type="info" text="string" />

Use the hour property to display the hour of the timestamp. This property can take the following values: "numeric", "2-digit".

<j-timestamp hour="numeric" value="2023-04-05T12:34:56Z"></j-timestamp>

```html
<j-timestamp hour="numeric" value="2023-04-05T12:34:56Z"></j-timestamp>
```

### minute <Badge type="info" text="string" />

Use the minute property to display the minute of the timestamp. This property can take the following values: "numeric", "2-digit".

<j-timestamp minute="numeric" value="2023-04-05T12:34:56Z"></j-timestamp>

```html
<j-timestamp minute="numeric" value="2023-04-05T12:34:56Z"></j-timestamp>
```

### second <Badge type="info" text="string" />

Use the second property to display the second of the timestamp. This property can take the following values: "numeric", "2-digit".

<j-timestamp second="numeric" value="2023-04-05T12:34:56Z"></j-timestamp>

```html
<j-timestamp second="numeric" value="2023-04-05T12:34:56Z"></j-timestamp>
```
