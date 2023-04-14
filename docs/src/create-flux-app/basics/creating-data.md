# Creating data

Because Flux is using the p2p framework AD4M, you don't have to worry about creating a database, or maintain server infrastructure. This makes it super easy to create new content in the community that is using your app.

You are free to create any kind of model for your data, but let's start with the common types that are used by Flux.

A flux app will always recieve two things. The `perspective` which is the `id` of the Flux community that is running your app, and also the `source`, which is the `id` of the channel your app is installed in.

```jsx
import { useState } from "react";
import { useEntry } from "@fluxapp/react";
import { Channel } from "@fluxapp/api";

export default function App({ perspective, source }) {
  const [title, setTitle] = useState("");
  const { entries, model } = useEntries(Post);

  function createPost() {
    model.create({ title });
  }

  return (
    <div>
      <j-text variant="heading">My first Flux app</j-text>

      <j-input
        value={title}
        onInput={(e) => setTitle(e.target.value)}
        placeholder="title"
      ></j-input>
      <j-button variant="primary" onClick={createPost}>
        Submit
      </j-button>
    </div>
  );
}
```
