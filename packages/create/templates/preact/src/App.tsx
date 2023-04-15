import styles from "./App.module.css";
import Todo from "./models/Todo";

import { useState } from "preact/hooks";
import { PerspectiveProxy } from "@perspect3vism/ad4m";
import { useEntries } from "utils/frameworks/react";

type Props = {
  perspective: PerspectiveProxy;
  source: string;
};

function PostView({ perspective, source }) {
  const [title, setTitle] = useState("");

  const { entries, model, loading } = useEntries({
    perspectiveUuid: perspective.uuid,
    source,
    model: Todo,
  });

  async function createTodo() {
    try {
      const test = await model.create({ todoTitle: title });
      console.log(test);
    } catch (e) {
      console.log(e);
    }
  }

  return (
    <div>
      <j-text variant="heading-lg">A Simple Todo App</j-text>
      <j-flex gap="300" a="center">
        <j-input
          full
          size="lg"
          placeholder="Add a Todo"
          value={title}
          onInput={(e) => setTitle(e.target.value)}
        ></j-input>
        <j-button
          size="lg"
          variant="primary"
          loading={loading}
          onClick={createTodo}
        >
          Add Todo
        </j-button>
      </j-flex>
      <j-box pt="900">
        <j-flex gap="500" direction="column">
          {!entries.length && "No todos yet"}
          {entries.map((todo) => (
            <j-box bg="ui-50" p="500" radius="md">
              <j-flex j="between">
                <div>
                  <j-checkbox size="sm">
                    <j-text size="600" nomargin>
                      {todo.todoTitle}
                    </j-text>
                  </j-checkbox>
                </div>
                <j-button size="sm" variant="ghost" circle>
                  <j-icon name="x"></j-icon>
                </j-button>
              </j-flex>
            </j-box>
          ))}
        </j-flex>
      </j-box>
    </div>
  );
}

export default function App({ perspective, source }: Props) {
  return (
    <div className={styles.appContainer}>
      {perspective ? (
        <PostView perspective={perspective} source={source}></PostView>
      ) : (
        <j-text variant="heading-lg">Please choose a perspective first</j-text>
      )}
    </div>
  );
}
