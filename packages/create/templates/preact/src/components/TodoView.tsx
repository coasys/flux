import { useState } from "preact/hooks";
import { PerspectiveProxy } from "@perspect3vism/ad4m";
import { useEntry, useEntries } from "utils/frameworks/react";

import { Community, Post } from "utils/api";
import Todo from "../models/Todo";

import styles from "../App.module.css";

type Props = {
  perspective: PerspectiveProxy;
  source: string;
};

export default function TodoView({ perspective, source }: Props) {
  const [title, setTitle] = useState("");

  const { entry: community } = useEntry({
    perspective,
    model: Community,
  });

  const { entries: todos, model } = useEntries({
    perspective,
    source,
    model: Todo,
  });

  function createTodo(event: React.KeyboardEvent<Element>) {
    if (event.key !== "Enter") return;
    model
      .create({ title: title })
      .then(() => {
        setTitle("");
      })
      .catch(console.log);
  }

  function toggleTodo({ id, done }) {
    model.update(id, { done }).catch(console.log);
  }

  function deleteTodo(id: string) {
    model.remove(id).catch(console.log);
  }

  return (
    <div>
      <j-box pt="900" pb="400">
        <j-text
          uppercase
          size="300"
          weight="800"
          color="primary-500"
          variant="success"
        >
          {community?.name}
        </j-text>
      </j-box>

      <input
        autoFocus
        className={styles.titleInput}
        placeholder="Write a title"
        value={title}
        onKeyDown={createTodo}
        onChange={(e) => setTitle(e.target.value)}
      ></input>

      <j-box pt="500">
        <j-flex gap="300" direction="column">
          {todos.map((todo) => (
            <j-box bg="ui-50" p="400" radius="md">
              <j-flex j="between">
                <div className={todo.done ? styles.doneTodo : ""}>
                  <j-checkbox
                    onChange={(e) =>
                      toggleTodo({ id: todo.id, done: e.target.checked })
                    }
                    checked={todo.done}
                    style="--j-border-radius: 50%;"
                    size="sm"
                  >
                    <j-icon slot="checkmark" size="xs" name="check"></j-icon>
                    <j-text size="500" nomargin>
                      {todo.title}
                    </j-text>
                    <j-text size="500" nomargin>
                      {todo.desc}
                    </j-text>
                  </j-checkbox>
                </div>
                <j-button onClick={() => deleteTodo(todo.id)}>Delete</j-button>
              </j-flex>
            </j-box>
          ))}
        </j-flex>
      </j-box>
    </div>
  );
}
