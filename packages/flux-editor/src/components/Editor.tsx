import { useMemo, useState } from "preact/hooks";
import { PerspectiveProxy } from "@perspect3vism/ad4m";
import { useEntries } from "@fluxapp/react-web";
import { createEditor, BaseEditor } from "slate";
import { Slate, Editable, withReact, ReactEditor } from "slate-react";
import { Message } from "@fluxapp/api";

import deserialize from "../utils/deserialize";
import serialize from "../utils/serialize";
import withMentions from "../utils/withMentions";

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
  initialValue?: string;
};

export default function Editor({ perspective, source, initialValue }: Props) {
  const [content, setContent] = useState([]);
  const editor = useMemo(() => withMentions(withReact(createEditor())), []);

  const initialValueMemo = useMemo(
    () =>
      initialValue
        ? deserialize(initialValue)
        : [
            {
              type: "paragraph",
              children: [{ text: "" }],
            },
          ],
    []
  );

  const { model } = useEntries({
    perspective,
    source,
    model: Message,
  });

  function onKeyDown(event: React.KeyboardEvent<Element>) {
    if (event.key !== "Enter") return;
    createMessage();
  }

  function createMessage() {
    model
      .create({ body: content })
      .then((result) => {
        console.log("CREATED: ", result);
      })
      .catch(console.log);
  }

  return (
    <div>
      <Slate
        editor={editor}
        value={initialValueMemo}
        onChange={(value) => {
          const isLastChange = editor.operations.some(
            (op) => "set_selection" !== op.type
          );
          if (isLastChange) {
            setContent(serialize(value));
          }
        }}
      >
        <Editable className={styles.wrapper} onKeyDown={onKeyDown} />
      </Slate>
      <j-button onclick={createMessage}>Post</j-button>
    </div>
  );
}
