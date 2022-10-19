import { useState, useRef, useContext } from "preact/hooks";
import { EditorContent } from "@tiptap/react";
import { useEffect } from "preact/hooks";
import styles from "./index.scss";
import UIContext from "../../context/UIContext";
import EditorContext from "../../context/EditorContext";

export default function Tiptap({perspectiveUuid, channelId}) {
  const [showToolbar, setShowToolbar] = useState(false);
  const {
    state: { editor, value },
    methods: {onSend}
  } = useContext(EditorContext);

  const emojiPicker = useRef();

  const {
    state: { currentReply },
  } = useContext(UIContext);

  useEffect(() => {
    if (emojiPicker.current) {
      emojiPicker.current.addEventListener("emoji-click", onEmojiClick);
    }

    return () => {
      if (emojiPicker.current) {
        emojiPicker.current.removeEventListener("emoji-click", onEmojiClick);
      }
    }
  }, [emojiPicker.current, editor]);

  useEffect(() => {
    if (editor && value.length === 0) {
      editor.commands.setContent(value);
    }
  }, [value]);

  useEffect(() => {
    if (currentReply) {
      editor.commands.focus();
    }
  }, [currentReply]);

  function onEmojiClick(event: CustomEvent) {
    if (editor) {
      const anchorPosition = editor.view.state.selection;
      editor
        .chain()
        .focus()
        .insertContentAt(anchorPosition, [
          {
            type: "emoji",
            attrs: {
              label: event.detail.unicode,
              id: event.detail.emoji.shortcodes[0],
              trigger: ":",
            },
          },
          {
            type: "text",
            text: " ",
          },
        ])
        .run();
    }
  }

  return (
    <div class={styles.editor}>
      <div id={`mentionWrapper-${perspectiveUuid}-${channelId}`} class={styles.mentionWrapper}></div>
      {showToolbar && (
        <div>
          <j-button
            variant="ghost"
            size="sm"
            style={{
              color: editor.isActive("bold")
                ? "var(--j-color-primary-500)"
                : "inherit",
            }}
            onClick={() => editor?.chain().toggleBold().focus().run()}
          >
            <j-icon size="sm" name="type-bold"></j-icon>
          </j-button>
          <j-button
            variant="ghost"
            size="sm"
            style={{
              color: editor.isActive("italic")
                ? "var(--j-color-primary-500)"
                : "inherit",
            }}
            onClick={() => editor?.chain().toggleItalic().focus().run()}
          >
            <j-icon size="sm" name="type-italic"></j-icon>
          </j-button>
          <j-button
            variant="ghost"
            size="sm"
            style={{
              color: editor.isActive("strike")
                ? "var(--j-color-primary-500)"
                : "inherit",
            }}
            onClick={() => editor?.chain().toggleStrike().focus().run()}
          >
            <j-icon size="sm" name="type-strikethrough"></j-icon>
          </j-button>
          <j-button
            variant="ghost"
            size="sm"
            style={{
              color: editor.isActive("bulletList")
                ? "var(--j-color-primary-500)"
                : "inherit",
            }}
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
          >
            <j-icon size="sm" name="list-ul"></j-icon>
          </j-button>
          <j-button
            variant="ghost"
            size="sm"
            style={{
              color: editor.isActive("orderedList")
                ? "var(--j-color-primary-500)"
                : "inherit",
            }}
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          >
            <j-icon size="sm" name="list-ol"></j-icon>
          </j-button>
        </div>
      )}
      <div class={styles.editorWrapper}>
        <EditorContent class={styles.editorContent} editor={editor} />
        <j-flex>
          <j-popover placement="top">
            <j-button slot="trigger" variant="ghost" size="sm">
              <j-icon size="sm" name="emoji-smile"></j-icon>
            </j-button>
            <div slot="content">
              <emoji-picker
                class={styles.picker}
                ref={emojiPicker}
                onEmojiClick={onEmojiClick}
              />
            </div>
          </j-popover>
          <j-button
            variant="ghost"
            size="sm"
            onClick={() => setShowToolbar(!showToolbar)}
          >
            <j-icon size="sm" name="type"></j-icon>
          </j-button>
          <j-button
            onClick={() => onSend(editor.getHTML())}
            variant="primary"
            size="sm"
            square
            circle
          >
            <j-icon size="sm" name="send"></j-icon>
          </j-button>
        </j-flex>
      </div>
    </div>
  );
}
