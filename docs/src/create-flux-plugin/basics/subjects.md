# Subjects

Because Flux is using the p2p framework AD4M, you don't have to worry about creating a database, or maintain server infrastructure. This makes it super easy to create new content in the community that is using your plugin.

Subjects in ADAM is basically a way to create definitions of "concepts" in Neighbourhood that can be used similar to a database schema.

You are free to create any kind of Subject for your data, but let's start with the common types that are used by Flux.

## Built-in models

Because Flux Plugins share a lot of functionality, it comes bundled with several commonly used models that can be imported from `@fluxapp/api`:

- Community
- Channel
- Plugin
- Message
- Post

```ts
import { useSubject } from "@fluxapp/react";
import { Community } from "@fluxapp/api";

const { entry: community } = useSubject({
  perspective,
  subject: Community,
});
```

## Custom models

Defining your own models can be done by creating a new `SDNAClass`. The below shows an example `Todo` subject, which is included as an example in the `@fluxapp/create` boilerplate:

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
