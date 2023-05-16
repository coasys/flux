import { Profile } from "@fluxapp/types";
import { BaseEditor, Transforms } from "slate";
import { ReactEditor } from "slate-react";
import { insertMention } from "../../../utils/mentions";

import styles from "./MentionMenu.module.css";

type Props = {
  editor: BaseEditor & ReactEditor;
  index: number;
  people: Profile[];
  setTarget: (val) => void;
};

export default function MentionMenu({
  editor,
  index,
  people,
  setTarget,
}: Props) {
  return (
    <j-menu>
      {people.map((person, i) => (
        <j-menu-item
          key={person.did}
          selected={i === index}
          onClick={() => {
            Transforms.select(editor, target);
            insertMention(editor, person);
            setTarget(null);
          }}
        >
          <j-flex a="center" gap="300">
            <j-avatar hash={`did:key:${person.did}`} size="xs"></j-avatar>
            <j-text variant="body" nomargin>
              {" "}
              {person.username}
            </j-text>
          </j-flex>
        </j-menu-item>
      ))}
    </j-menu>
  );
}
