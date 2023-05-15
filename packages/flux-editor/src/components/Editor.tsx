import { useState } from "preact/hooks";
import { PerspectiveProxy } from "@perspect3vism/ad4m";
import { useEntry, useEntries } from "@fluxapp/react-web";

// Import the Slate editor factory.
import { createEditor, BaseEditor, Descendant } from "slate";

// Import the Slate components and React plugin.
import { Slate, Editable, withReact, ReactEditor } from "slate-react";

import { Community, Post } from "@fluxapp/api";
import Todo from "../models/Todo";

import styles from "./Editor.module.css";

type CustomElement = { type: "paragraph"; children: CustomText[] };
type CustomText = { text: string };

declare module "slate" {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor;
    Element: CustomElement;
    Text: CustomText;
  }
}

type Props = {
  perspective: PerspectiveProxy;
  source: string;
};

export default function Editor({ perspective, source }: Props) {
  // Create a Slate editor object that won't change across renders.
  const [editor] = useState(() => withReact(createEditor()));

  const initialValue = [
    {
      type: "paragraph",
      children: [{ text: "A line of text in a paragraph." }],
    },
  ];

  // const { entry: community } = useEntry({
  //   perspective,
  //   model: Community,
  // });

  // const { entries: todos, model } = useEntries({
  //   perspective,
  //   source,
  //   model: Todo,
  // });

  // function createTodo(event: React.KeyboardEvent<Element>) {
  //   if (event.key !== "Enter") return;
  //   model
  //     .create({ title: title })
  //     .then(() => {
  //       setTitle("");
  //     })
  //     .catch(console.log);
  // }

  // function toggleTodo({ id, done }) {
  //   model.update(id, { done }).catch(console.log);
  // }

  // function deleteTodo(id: string) {
  //   model.remove(id).catch(console.log);
  // }

  return (
    <div>
      <Slate editor={editor} value={initialValue}>
        <Editable className={styles.wrapper} />
      </Slate>
    </div>
  );
}
