# Models

Because Flux is using the p2p framework AD4M, you don't have to worry about creating a database, or maintain server infrastructure. This makes it super easy to create new content in the community that is using your plugin.

You are free to create any kind of model for your data, but let's start with the common types that are used by Flux.

## Built-in models

Because Flux Plugins share a lot of functionality, it comes bundled with several commonly used models that can be imported from `@fluxapp/api`:

- Community
- Channel
- Plugin
- Message
- Post

```ts
import { useEntry } from "@fluxapp/react";
import { Community } from "@fluxapp/api";

const { entry: community } = useEntry({
  perspective,
  model: Community,
});
```

## Custom models

Defining your own models can be done by creating a new `SDNAClass`. The below shows an example `Todo` model, which is included as an example in the `@fluxapp/create` boilerplate:

```ts
// models/Todo.ts

import { SDNAClass, subjectProperty, subjectFlag } from "@perspect3vism/ad4m";

@SDNAClass({
  name: "Todo",
})
export default class Todo {
  @subjectFlag({
    through: "flux://entry_type",
    value: "flux://has_todo",
  })
  type: string;

  @subjectProperty({
    through: "rdf://title",
    writable: true,
    resolveLanguage: "literal",
  })
  title: string;

  @subjectProperty({
    through: "rdf://description",
    writable: true,
    resolveLanguage: "literal",
  })
  desc: string;

  @subjectProperty({
    through: "rdf://status",
    writable: true,
    resolveLanguage: "literal",
  })
  done: boolean;
}
```
