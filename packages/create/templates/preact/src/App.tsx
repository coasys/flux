import styles from "./App.module.css";
import Todo from "./models/Todo";

import { Channel, Community } from "utils/api";
import { useState } from "preact/hooks";
import { PerspectiveProxy } from "@perspect3vism/ad4m";
import { useEntries, useEntry } from "utils/frameworks/react";

type Props = {
  perspective: PerspectiveProxy;
  source: string;
};

function PostView({ perspective, source }) {
  const [alert, setAlert] = useState({ text: "", open: false, variant: "" });
  const [title, setTitle] = useState("");

  const { entry } = useEntry({
    perspectiveUuid: perspective.uuid,
    model: Community,
  });

  const { entries, model, loading } = useEntries({
    perspectiveUuid: perspective.uuid,
    source,
    model: Todo,
  });

  console.log({ entries, entry, source });

  async function createTodo() {
    try {
      await model.create({ title: title }).catch(console.log);
      setAlert({
        open: true,
        variant: "success",
        text: "Successfully created new todo!",
      });
    } catch (e) {
      setAlert({
        open: true,
        variant: "danger",
        text: "Could not create todo!",
      });
    }
  }

  async function toggleTodo({ id, done }) {
    try {
      const updated = await model.update(id, { done });
      setAlert({
        open: true,
        variant: "success",
        text: "Updated todo!",
      });
    } catch (e) {
      setAlert({
        open: true,
        variant: "success",
        text: "Could not update todo!",
      });
    }
  }

  return (
    <div>
      <j-box pb="400">
        <j-badge variant="success">{perspective.name}</j-badge>
      </j-box>
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
        {!entries.length && "No todos yet"}
        <j-flex gap="300" direction="column">
          {entries.map((todo) => (
            <j-box bg="ui-50" p="400" radius="md">
              <j-flex j="between">
                <div>
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
                  </j-checkbox>
                </div>
              </j-flex>
            </j-box>
          ))}
        </j-flex>
      </j-box>
      <j-toast
        variant="success"
        onToggle={(e: any) =>
          setAlert({ text: alert.text, open: e.target.open })
        }
        open={alert.open}
      >
        {alert.text}
      </j-toast>
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
