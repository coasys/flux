# Data

With your Subjects defined, writing and reading data can be done by writing and subscribing to the AD4M perspective.

This logic has been bundled into two hooks: `useEntry` and `useEntries`, for working with a single item and lists of items respectively.

A Flux Plugin will always recieve two things.

- `perspective` which is a [`PerspectiveProxy`](https://docs.ad4m.dev/jsdoc/classes/PerspectiveProxy/).
- `channelSource` which is the `id` of the channel your plugin is installed in.
- `agent` which is a [`AgentClient`](https://github.com/coasys/ad4m/blob/3fdcfb8c1be14415d1c264804584c924f27c7a35/core/src/agent/AgentClient.ts), that allows you to interact with the Agent/User.

## Getting a list of items

Now, let's get a list of Todo's, which is also part of the boilerplate. This assumes we've created a Subject Class called `Todo` with a given set of fields.

```jsx
import { useEntry, useEntries } from "@fluxapp/react";
import { Community } from "@fluxapp/api";
import Todo from "../subjects/Todo";  // [!code ++]

export default function TodoView({ perspective, channelSource })
  const { entry: community } = useEntry({
    perspective,
    subject: Community,
  });

  const { entries: todos, repo } = useEntries({  // [!code ++]
    perspective,  // [!code ++]
    source: channelSource,  // [!code ++]
    subject: Todo,  // [!code ++]
  });  // [!code ++]

  return (
    <h1>{community?.name}</h1>

    <ul> // [!code ++]
      {todos?.map(todo => <li>{todo.name}</li>)} // [!code ++]
    </ul>  // [!code ++]
  )
};
```

## Getting a single item

If we want to fetch a single entry based on it's id. We can use the `useEntry` hook and just pass in an id.

```tsx
import { useEntry } from "@fluxapp/react";
import { Todo } from "@fluxapp/api";

export default function Todo({ perspective, id }) {
  const { entry: todo } = useEntry({
    perspective,
    id:
    subject: Todo,
  });

  return (
    <h1>{todo?.title}</h1>
  )
};
```

## Creating data

To create data, all we need to do is use `repo.create()` on the repo we want to add the data to. Let's create a new Todo item.

::: tip
Since we're subscribed to all changes, the list of Todos will automatically update when we create a new item!
:::

```jsx
import { useEntry, useEntries } from "@fluxapp/react";
import { Community } from "@fluxapp/api";
import Todo from "../subjects/Todo";

export default function TodoView({ perspective, channelSource }) {
  const [title, setTitle] = useState(""); // [!code ++]

  const { entry: community } = useEntry({
    perspective,
    subject: Community,
  });

  const { entries: todos, repo } = useEntries({
    perspective,
    source: channelSource,
    subject: Todo,
  });

  function createTodo(e) { // [!code ++]
    if (e.key !== "Enter") return; // [!code ++]
    repo.create({ title: title }) // [!code ++]
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

Next, let's add functionality to toggle a Todo's state using the `repo.update()` function.

In this example we use the [j-checkbox](/ui-library/components/checkbox.html) web-component from Flux UI:

```jsx
import { useEntry, useEntries } from "@fluxapp/react";
import { Community } from "@fluxapp/api";
import Todo from "../subjects/Todo";

export default function TodoView({ perspective, channelSource }) {
  const [title, setTitle] = useState("");

  const { entry: community } = useEntry({
    perspective,
    subject: Community,
  });

  const { entries: todos, repo } = useEntries({
    perspective,
    source: channelSource,
    subject: Todo,
  });

  function createTodo(e) {
    if (e.key !== "Enter") return;
    repo.create({ title: title })
  }

  function toggleTodo({ id, done }) { // [!code ++]
    repo.update(id, { done }); // [!code ++]
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

Deleting data, as you might guess, is done with `repo.remove()`. Let's add a button for deleting Todo-items:

```jsx
import { useEntry, useEntries } from "@fluxapp/react";
import { Community } from "@fluxapp/api";
import Todo from "../subjects/Todo";

export default function TodoView({ perspective, channelSource }) {
  const [title, setTitle] = useState("");

  const { entry: community } = useEntry({
    perspective,
    subject: Community,
  });

  const { entries: todos, repo } = useEntries({
    perspective,
    source: channelSource,
    subject: Todo,
  });

  function createTodo(e) {
    if (e.key !== "Enter") return;
    repo.create({ title: title })
  }

  function toggleTodo({ id, done }) {
    repo.update(id, { done });
  }

  function deleteTodo(id: string) { // [!code ++]
    repo.remove(id); // [!code ++]
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
