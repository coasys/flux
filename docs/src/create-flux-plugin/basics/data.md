# Data

With your Models defined, writing and reading data can be done by writing and subscribing to the AD4M perspective.

This logic has been bundled into two hooks: `useEntry` and `useEntries`, for working with a single item and lists of items respectively.

## Getting a single item

Let's look at the example Todo Plugin included in the `@fluxapp/create` setup. The first thing we do is fetch the community we're in using `useEntry` and the included `Community` Model:

```tsx
import { useEntry } from "@fluxapp/react";
import { Community } from "@fluxapp/api";

export default function TodoView({ perspective, channelSource })
  const { entry: community } = useEntry({
    perspective,
    model: Community,
  });

  return (
    <h1>{community?.name}</h1>
  )
};
```

A Flux Plugin will always recieve two things. The `perspective` which is the `id` of the Flux community that is running your plugin, and also the `channelSource`, which is the `id` of the channel your plugin is installed in.

## Getting a list of items

Now, let's get a list of Todo's, which is also part of the boilerplate. This assumes we've created a model called `Todo` with a given set of fields.

```jsx
import { useEntry, useEntries } from "@fluxapp/react";
import { Community } from "@fluxapp/api";
import Todo from "../models/Todo";  // [!code ++]

export default function TodoView({ perspective, channelSource })
  const { entry: community } = useEntry({
    perspective,
    model: Community,
  });

  const { entries: todos, model } = useEntries({  // [!code ++]
    perspective,  // [!code ++]
    source: channelSource,  // [!code ++]
    model: Todo,  // [!code ++]
  });  // [!code ++]

  return (
    <h1>{community?.name}</h1>

    <ul> // [!code ++]
      {todos?.map(todo => <li>{todo.name}</li>)} // [!code ++]
    </ul>  // [!code ++]
  )
};
```

## Creating data

To create data, all we need to do is use `model.create()` on the model we want to add the data to. Let's create a new Todo item.

::: tip
Since we're subscribed to all changes, the list of Todos will automatically update when we create a new item!
:::

```jsx
import { useEntry, useEntries } from "@fluxapp/react";
import { Community } from "@fluxapp/api";
import Todo from "../models/Todo";

export default function TodoView({ perspective, channelSource })
  const [title, setTitle] = useState(""); // [!code ++]

  const { entry: community } = useEntry({
    perspective,
    model: Community,
  });

  const { entries: todos, model } = useEntries({
    perspective,
    source: channelSource,
    model: Todo,
  });

  function createTodo(e) { // [!code ++]
    if (e.key !== "Enter") return; // [!code ++]
    model.create({ title: title }) // [!code ++]
  } // [!code ++]

  return (
    <h1>{community?.name}</h1>

    <input // [!code ++]
      placeholder="Name of Todo" // [!code ++]
      onKeyDown={createTodo} // [!code ++]
      onChange={(e) => setTitle(e.target.value)} // [!code ++]
    /> // [!code ++]

    <ul>
      {todos?.map(todo => <li>{todo.name}</li>)}
    </ul>
  )
};
```

## Updating data

Next, let's add functionality to toggle a Todo's state using the `mode.update()` function.

In this example we use the [j-checkbox](/ui-library/components/checkbox.html) web-component from Flux UI:

```jsx
import { useEntry, useEntries } from "@fluxapp/react";
import { Community } from "@fluxapp/api";
import Todo from "../models/Todo";

export default function TodoView({ perspective, channelSource }) {
  const [title, setTitle] = useState("");

  const { entry: community } = useEntry({
    perspective,
    model: Community,
  });

  const { entries: todos, model } = useEntries({
    perspective,
    source: channelSource,
    model: Todo,
  });

  function createTodo(e) {
    if (e.key !== "Enter") return;
    model.create({ title: title })
  }

  function toggleTodo({ id, done }) { // [!code ++]
    model.update(id, { done }); // [!code ++]
  } // [!code ++]

  return (
    <h1>{community?.name}</h1>

    <input
      placeholder="Name of Todo"
      onKeyDown={createTodo}
      onChange={(e) => setTitle(e.target.value)}
    />

    <ul>
      {todos?.map(todo => (
        <li>
          <j-checkbox // [!code ++]
            onChange={(e) => // [!code ++]
              toggleTodo({ id: todo.id, done: e.target.checked }) // [!code ++]
            } // [!code ++]
            checked={todo.done} // [!code ++]
            > // [!code ++]
            {todo.name}
          </j-checkbox>  // [!code ++]
        </li>
      )}
    </ul>
  )
};
```

## Deleting data

Deleting data, as you might guess, is done with `model.remove()`. Let's add a button for deleting Todo-items:

```jsx
import { useEntry, useEntries } from "@fluxapp/react";
import { Community } from "@fluxapp/api";
import Todo from "../models/Todo";

export default function TodoView({ perspective, channelSource }) {
  const [title, setTitle] = useState("");

  const { entry: community } = useEntry({
    perspective,
    model: Community,
  });

  const { entries: todos, model } = useEntries({
    perspective,
    source: channelSource,
    model: Todo,
  });

  function createTodo(e) {
    if (e.key !== "Enter") return;
    model.create({ title: title })
  }

  function toggleTodo({ id, done }) {
    model.update(id, { done });
  }

  function deleteTodo(id: string) { // [!code ++]
    model.remove(id); // [!code ++]
  } // [!code ++]

  return (
    <h1>{community?.name}</h1>

    <input
      placeholder="Name of Todo"
      onKeyDown={createTodo}
      onChange={(e) => setTitle(e.target.value)}
    />

    <ul>
      {todos?.map(todo => (
        <li>
          <j-checkbox
            onChange={(e) =>
              toggleTodo({ id: todo.id, done: e.target.checked })
            }
            checked={todo.done}
            >
            {todo.name}
          </j-checkbox>
          <j-button onClick={() => deleteTodo(todo.id)}>Delete</j-button> // [!code ++]
        </li>
      )}
    </ul>
  )
};
```
