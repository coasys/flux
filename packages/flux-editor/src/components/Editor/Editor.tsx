import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "preact/hooks";
import { PerspectiveProxy } from "@perspect3vism/ad4m";
import { useEntry } from "@fluxapp/react-web";
import {
  Editor as SlateEditor,
  createEditor,
  BaseEditor,
  Transforms,
  Range,
  Descendant,
} from "slate";
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
import MentionMenu from "./MentionMenu";

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
  // const people = members
  //   ?.filter((m) => m.username.toLowerCase().startsWith(search.toLowerCase()))
  //   .slice(0, 10);

  useEffect(() => {
    fetchProfiles();
  }, []);

  const people = [
    { did: "123", username: "BambinoToad" },
    { did: "223", username: "ToadChrisT" },
    { did: "323", username: "Toad" },
    { did: "423", username: "ToadRoxblang" },
  ]
    .filter((m) => m.username.toLowerCase().startsWith(search.toLowerCase()))
    .slice(0, 10) as Profile[];

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

  function onChange(value: Descendant[]) {
    const { selection, operations } = editor;

    // Check for mentions
    if (selection && Range.isCollapsed(selection)) {
      const [start] = Range.edges(selection);
      const wordBefore = SlateEditor.before(editor, start, {
        unit: "word",
      });
      const before = wordBefore && SlateEditor.before(editor, wordBefore);
      const beforeRange = before && SlateEditor.range(editor, before, start);
      const beforeText = beforeRange && SlateEditor.string(editor, beforeRange);
      const beforeMatch = beforeText && beforeText.match(/^@(\w+)$/);
      const after = SlateEditor.after(editor, start);
      const afterRange = SlateEditor.range(editor, start, after);
      const afterText = SlateEditor.string(editor, afterRange);
      const afterMatch = afterText.match(/^(\s|$)/);

      if (beforeMatch && afterMatch) {
        setTarget(beforeRange);
        setSearch(beforeMatch[1]);
        setIndex(0);
        return;
      }
    }

    setTarget(null);

    // const isLastChange = operations.some(
    //   (op) => "set_selection" !== op.type
    // );
    // if (isLastChange) {
    //   setContent(serialize(value));
    // }
  }

  function onSubmit() {
    model
      .create({ body: content })
      .then((result) => {
        console.log("CREATED: ", result);
      })
      .catch(console.log);
  }

  return (
    <>
      <div className={styles.wrapper}>
        <Slate editor={editor} value={value} onChange={onChange}>
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
              <div ref={ref} className={styles["mentions-popup"]}>
                <MentionMenu
                  editor={editor}
                  index={index}
                  people={people}
                  setTarget={setTarget}
                />
              </div>
            </Portal>
          )}
        </Slate>
      </div>
      <div className={styles.footer}>
        <j-button onclick={onSubmit}>Post</j-button>
      </div>
    </>
  );
}
