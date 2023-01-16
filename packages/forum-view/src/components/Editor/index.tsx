import Link from "@tiptap/extension-link";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useState } from "preact/hooks";
import styles from "./index.module.css";

const MenuBar = ({ editor, allowFocus }) => {
  if (!editor) {
    return null;
  }

  return (
    <div class={styles.menuBar}>
      <j-button
        square
        variant="ghost"
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        tabIndex={allowFocus ? "0" : "-1"}
      >
        <j-icon
          name="type-bold"
          color={editor.isActive("bold") ? "primary-500" : "ui-500"}
        ></j-icon>
      </j-button>
      <j-button
        square
        variant="ghost"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        tabIndex={allowFocus ? "0" : "-1"}
      >
        <j-icon
          name="type-italic"
          color={editor.isActive("italic") ? "primary-500" : "ui-500"}
        ></j-icon>
      </j-button>
      <j-button
        square
        variant="ghost"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        disabled={!editor.can().chain().focus().toggleStrike().run()}
        tabIndex={allowFocus ? "0" : "-1"}
      >
        <j-icon
          name="type-strikethrough"
          color={editor.isActive("strike") ? "primary-500" : "ui-500"}
        ></j-icon>
      </j-button>
      <j-button
        square
        variant="ghost"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        tabIndex={allowFocus ? "0" : "-1"}
      >
        <j-icon
          name="list-ul"
          color={editor.isActive("bulletList") ? "primary-500" : "ui-500"}
        ></j-icon>
      </j-button>
      <j-button
        square
        variant="ghost"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        tabIndex={allowFocus ? "0" : "-1"}
      >
        <j-icon
          name="list-ol"
          color={editor.isActive("orderedList") ? "primary-500" : "ui-500"}
        ></j-icon>
      </j-button>
      <j-button
        square
        variant="ghost"
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        tabIndex={allowFocus ? "0" : "-1"}
      >
        <j-icon
          name="braces"
          color={editor.isActive("codeBlock") ? "primary-500" : "ui-500"}
        ></j-icon>
      </j-button>
      <j-button
        square
        variant="ghost"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        tabIndex={allowFocus ? "0" : "-1"}
      >
        <j-icon
          name="quote"
          color={editor.isActive("blockquote") ? "primary-500" : "ui-500"}
        ></j-icon>
      </j-button>
    </div>
  );
};

export default ({ onChange, initialContent, style = {} }) => {
  const [isTouched, setIsTouched] = useState(false);
  const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false);
  const editor = useEditor({
    extensions: [StarterKit, Link.configure({ autolink: true })],
    content: "",
  });

  // Populate with initial content
  useEffect(() => {
    if (editor && initialContent && !hasLoadedInitialData) {
      setHasLoadedInitialData(true);
      editor.commands.setContent(initialContent);
    }
  }, [initialContent, hasLoadedInitialData]);

  useEffect(() => {
    if (editor) {
      editor.on("update", () => {
        const html = editor.getHTML();
        onChange(html);

        if (!isTouched) {
          setIsTouched(true);
        }
      });
    }
  }, [editor, isTouched]);

  return (
    <div className={styles.editorWrapper}>
      <MenuBar editor={editor} allowFocus={isTouched} />
      <EditorContent style={style} className={styles.editor} editor={editor} />
    </div>
  );
};
