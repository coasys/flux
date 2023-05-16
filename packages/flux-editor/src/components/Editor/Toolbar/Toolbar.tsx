import { BaseEditor, Editor } from "slate";
import { ReactEditor } from "slate-react";

import styles from "./Toolbar.module.css";

type Props = {
  editor: BaseEditor & ReactEditor;
};

const MarkButton = ({ editor, format, icon }) => {
  const isMarkActive = (editor, format) => {
    const marks = Editor.marks(editor);
    return marks ? marks[format] === true : false;
  };

  const toggleMark = (editor, format) => {
    const isActive = isMarkActive(editor, format);

    if (isActive) {
      Editor.removeMark(editor, format);
    } else {
      Editor.addMark(editor, format, true);
    }
  };

  const isActive = isMarkActive(editor, format);

  return (
    <j-button
      square
      variant="ghost"
      onClick={(event) => {
        event.preventDefault();
        toggleMark(editor, format);
      }}
    >
      <j-icon name={icon} color={isActive ? "primary-500" : "ui-500"}></j-icon>
    </j-button>
  );
};

export default function Toolbar({ editor }: Props) {
  return (
    <div className={styles.wrapper}>
      <MarkButton editor={editor} format="bold" icon="type-bold" />
      <MarkButton editor={editor} format="italic" icon="type-italic" />
      <MarkButton
        editor={editor}
        format="strikethrough"
        icon="type-strikethrough"
      />
      <MarkButton editor={editor} format="code" icon="braces" />
    </div>
  );
}
