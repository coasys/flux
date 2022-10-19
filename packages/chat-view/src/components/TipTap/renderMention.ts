import { ReactRenderer } from "@tiptap/react";
import MentionList from "./MentionList";
import EmojiList from "./EmojiList";

export default function renderMention(perspectiveId: string, channelId: string) {
  let reactRenderer = null as any;

  let container = null;

  const getContainer = () => {
    if (!container) container = document.getElementById(`mentionWrapper-${perspectiveId}-${channelId}`);
    return container;
  }

  return {
    onStart: (props) => {
      const component = props.text === "@" ? MentionList : EmojiList;

      reactRenderer = new ReactRenderer(component, {
        props,
        editor: props.editor,
      });

      const container = getContainer();

      container.style.display = "block";
      container.append(reactRenderer.element);
    },
    onUpdate(props) {
      reactRenderer.updateProps(props);
    },
    onKeyDown(props) {
      return reactRenderer.ref?.onKeyDown(props);
    },
    onExit() {
      const container = getContainer();

      container.style.display = "none";
      container.innerHTML = "";
      reactRenderer.destroy();
    },
  };
}
