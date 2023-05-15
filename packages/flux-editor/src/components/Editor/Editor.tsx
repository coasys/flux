import { useCallback, useEffect, useMemo, useState } from "preact/hooks";
import { PerspectiveProxy } from "@perspect3vism/ad4m";
import { useEntry } from "@fluxapp/react-web";
import { createEditor, BaseEditor, Transforms } from "slate";
import { Slate, Editable, withReact, ReactEditor } from "slate-react";
import { Message, getProfile } from "@fluxapp/api";

import deserialize from "../../utils/deserialize";
import serialize from "../../utils/serialize";
import { withMentions, insertMention } from "../../utils/mentions";

import styles from "./Editor.module.css";
import { Profile } from "@fluxapp/types";
import Toolbar from "./Toolbar";
import Element from "./Element";
import Leaf from "./Leaf";

const defautValue = [{ type: "paragraph", children: [{ text: "" }] }];
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
  const [content, setContent] = useState("");
  const [members, setMembers] = useState<Profile[]>([]);
  const [target, setTarget] = useState<Range | undefined>();
  const [index, setIndex] = useState(0);
  const [search, setSearch] = useState("");
  const editor = useMemo(() => withMentions(withReact(createEditor())), []);
  const initialValueMemo = useMemo(
    () => (initialValue ? deserialize(initialValue) : defautValue),
    []
  );

  const renderElement = useCallback((props) => <Element {...props} />, []);
  const renderLeaf = useCallback((props) => <Leaf {...props} />, []);

  // Get all mentionable agents
  async function fetchProfiles() {
    const neighbourhood = perspective.getNeighbourhoodProxy();
    const othersDids = await neighbourhood.otherAgents();
    const profilePromises = othersDids.map(async (did) => getProfile(did));
    const newProfiles = await Promise.all(profilePromises);

    setMembers(newProfiles);
  }

  useEffect(() => {
    fetchProfiles();
  }, []);

  const { model } = useEntry({
    perspective,
    source,
    model: Message,
  });

  const people = members
    ?.filter((m) => m.username.toLowerCase().startsWith(search.toLowerCase()))
    .slice(0, 10);

  const onKeyDown = useCallback(
    (event) => {
      if (target && people.length > 0) {
        switch (event.key) {
          case "ArrowDown":
            event.preventDefault();
            const prevIndex = index >= people.length - 1 ? 0 : index + 1;
            setIndex(prevIndex);
            break;
          case "ArrowUp":
            event.preventDefault();
            const nextIndex = index <= 0 ? people.length - 1 : index - 1;
            setIndex(nextIndex);
            break;
          case "Tab":
          case "Enter":
            event.preventDefault();
            Transforms.select(editor, target);
            insertMention(editor, people[index]);
            setTarget(null);
            break;
          case "Escape":
            event.preventDefault();
            setTarget(null);
            break;
        }
      }
    },
    [people, editor, index, target]
  );

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
        <Toolbar editor={editor} />
        <Editable
          className={styles.wrapper}
          onKeyDown={onKeyDown}
          renderElement={renderElement}
          renderLeaf={renderLeaf}
        />
      </Slate>
      <j-button onclick={createMessage}>Post</j-button>
    </div>
  );
}
