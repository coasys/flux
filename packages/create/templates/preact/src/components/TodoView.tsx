import { useState } from "preact/hooks";
import { PerspectiveProxy } from "@coasys/ad4m";
import { useModel } from "@coasys/ad4m-react-hooks";

import Todo from "../subjects/Todo";

import styles from "../Plugin.module.css";

type Props = {
  perspective: PerspectiveProxy;
  source: string;
};

export default function TodoView({ perspective, source }: Props) {
  const [title, setTitle] = useState("");

  const { entries: todos } = useModel({ perspective, model: Todo, query: { source } });

  async function createTodo(event: React.KeyboardEvent<Element>) {
    if (event.key !== "Enter") return;
    const todo = new Todo(perspective, undefined, source);
    todo.title = title;
    await todo.save();
    setTitle("");
  }

  function toggleTodo({ id, done }) {
    const todo = new Todo(perspective, id, source);
    todo.done = done;
    todo.update();
  }

  function deleteTodo(id: string) {
    const todo = new Todo(perspective, id, source);
    todo.delete();
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
          Make a new todo
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
                      toggleTodo({ id: todo.baseExpression, done: e.target.checked })
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
                <j-button onClick={() => deleteTodo(todo.baseExpression)}>Delete</j-button>
              </j-flex>
            </j-box>
          ))}
        </j-flex>
      </j-box>
    </div>
  );
}
