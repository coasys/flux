import { ReactRenderer } from "@tiptap/react";
import MentionList from "./MentionList";

export default function renderMention() {
  let reactRenderer = null as any;

  const container = document.getElementById("mentionWrapper");

  return {
    onStart: (props) => {
      reactRenderer = new ReactRenderer(MentionList, {
        props,
        editor: props.editor,
      });

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
      container.style.display = "none";
      container.innerHTML = "";
      reactRenderer.destroy();
    },
  };
}
