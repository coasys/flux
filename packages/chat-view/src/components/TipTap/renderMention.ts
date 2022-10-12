import { ReactRenderer } from "@tiptap/react";
import tippy from "tippy.js";
import MentionList from "./MentionList";

export default function renderMention() {
  let reactRenderer = null as any;
  let popup = null as any;

  return {
    onStart: (props) => {
      reactRenderer = new ReactRenderer(MentionList, {
        props,
        editor: props.editor,
      });

      popup = tippy("body", {
        getReferenceClientRect: props.clientRect,
        appendTo: () => document.body,
        content: reactRenderer.element,
        showOnCreate: true,
        interactive: true,
        trigger: "manual",
        placement: "bottom-start",
      });
    },
    onUpdate(props) {
      reactRenderer.updateProps(props);

      popup[0].setProps({
        getReferenceClientRect: props.clientRect,
      });
    },
    onKeyDown(props) {
      return reactRenderer.ref?.onKeyDown(props);
    },
    onExit() {
      popup[0].destroy();
      reactRenderer.destroy();
    },
  };
}
