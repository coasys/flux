import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "preact/hooks";
import { PerspectiveProxy } from "@perspect3vism/ad4m";
import { useEntry } from "@fluxapp/react-web";
import { createEditor, BaseEditor, Transforms } from "slate";
import { Slate, Editable, withReact, ReactEditor } from "slate-react";
import { Message, getProfile } from "@fluxapp/api";
import { Profile } from "@fluxapp/types";

import deserialize from "../../utils/deserialize";
import serialize from "../../utils/serialize";
import { withMentions, insertMention } from "../../utils/mentions";

import styles from "./Editor.module.css";
import Toolbar from "./Toolbar";
import Element from "./Element";
import Leaf from "./Leaf";
import Portal from "../Portal";

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
  const ref = useRef<HTMLDivElement | null>();
  const editor = useMemo(() => withMentions(withReact(createEditor())), []);
  const value = useMemo(
    () => (initialValue ? deserialize(initialValue) : defautValue),
    []
  );

  // Local state
  const [content, setContent] = useState("");
  const [members, setMembers] = useState<Profile[]>([]);
  const [target, setTarget] = useState<Range | undefined>();
  const [index, setIndex] = useState(0);
  const [search, setSearch] = useState("");

  // Custom renderers
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

  const { model } = useEntry({
    perspective,
    source,
    model: Message,
  });

  // Get all mentionable people
  const people = members
    ?.filter((m) => m.username.toLowerCase().startsWith(search.toLowerCase()))
    .slice(0, 10);

  useEffect(() => {
    fetchProfiles();
  }, []);

  useEffect(() => {
    if (target && people.length > 0) {
      const el = ref.current;
      const domRange = ReactEditor.toDOMRange(editor, target);
      const rect = domRange.getBoundingClientRect();
      el.style.top = `${rect.top + window.pageYOffset + 24}px`;
      el.style.left = `${rect.left + window.pageXOffset}px`;
    }
  }, [people.length, editor, index, search, target]);

  // Listen for keyboard events
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

  console.log("people: ", people);

  return (
    <>
      <div className={styles.wrapper}>
        <Slate
          editor={editor}
          value={value}
          onChange={(value) => {
            const isLastChange = editor.operations.some(
              (op) => "set_selection" !== op.type
            );
            if (isLastChange) {
              setContent(serialize(value));
            }
          }}
        >
          <div className={styles.toolbar}>
            <Toolbar editor={editor} />
          </div>
          <div className={styles.body}>
            <Editable
              className={styles.field}
              onKeyDown={onKeyDown}
              renderElement={renderElement}
              renderLeaf={renderLeaf}
              placeholder="Enter some text..."
            />
          </div>
          {target && people.length > 0 && (
            <Portal>
              <div
                ref={ref}
                style={{
                  top: "-9999px",
                  left: "-9999px",
                  position: "absolute",
                  zIndex: 1,
                  padding: "3px",
                  background: "white",
                  borderRadius: "4px",
                  boxShadow: "0 1px 5px rgba(0,0,0,.2)",
                }}
                data-cy="mentions-portal"
              >
                {people.map((person, i) => (
                  <div
                    key={person.did}
                    onClick={() => {
                      Transforms.select(editor, target);
                      insertMention(editor, person);
                      setTarget(null);
                    }}
                    style={{
                      padding: "1px 3px",
                      borderRadius: "3px",
                      background: i === index ? "#B4D5FF" : "transparent",
                    }}
                  >
                    {person.username}
                  </div>
                ))}
              </div>
            </Portal>
          )}
        </Slate>
      </div>
      <j-button onclick={createMessage}>Post</j-button>
    </>
  );
}
