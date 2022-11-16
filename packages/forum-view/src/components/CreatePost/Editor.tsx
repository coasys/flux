import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "preact/hooks";
import styles from "./index.scss";

const MenuBar = ({ editor }) => {
  if (!editor) {
    return null;
  }

  return (
    <>
      <j-button
        square
        variant="ghost"
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
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
      >
        <j-icon
          name="quote"
          color={editor.isActive("blockquote") ? "primary-500" : "ui-500"}
        ></j-icon>
      </j-button>
    </>
  );
};

export default ({ onChange }) => {
  const editor = useEditor({
    extensions: [StarterKit],
    content: "",
  });

  useEffect(() => {
    if (editor) {
      editor.on("update", () => {
        const html = editor.getHTML();
        onChange(html);
      });
    }
  }, [editor]);

  return (
    <div>
      <MenuBar editor={editor} />
      <EditorContent className={styles.editor} editor={editor} />
    </div>
  );
};
