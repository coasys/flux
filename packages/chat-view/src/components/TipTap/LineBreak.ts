import {
  Node,
  mergeAttributes,
  getNodeType,
  Range,
  findParentNode,
  isList,
} from "@tiptap/core";

export interface HardBreakOptions {
  HTMLAttributes: Record<string, any>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    hardBreak: {
      /**
       * Add a hard break
       */
      setHardBreak: () => ReturnType;
    };
  }
}

export default Node.create({
  name: "hardBreak",
  addOptions: () => ({
    HTMLAttributes: {},
  }),
  inline: true,
  group: "inline",
  selectable: false,
  parseHTML() {
    return [{ tag: "br" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["br", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)];
  },
  addCommands() {
    return {
      setHardBreak: () => (props) => {
        const { state, editor } = props;
        const listNodeType = getNodeType("listItem", state.schema);

        const executedCommand = props.commands.first([
          () => props.commands.exitCode(),
          () => {
            if (state.selection.$anchor.node().textContent.length <= 0) {
              const parentList = findParentNode((node) =>
                isList(node.type.name, editor.extensionManager.extensions)
              )(state.selection);

              if (parentList) {
                props.commands.toggleList(parentList.node.type, listNodeType);
                return props.commands.createParagraphNear();
              }
            }

            return props.commands.splitListItem(listNodeType);
          },
          () => props.commands.insertContent({ type: this.name }),
        ]);

        return executedCommand
      },
    };
  },
  addKeyboardShortcuts() {
    return {
      "Mod-Enter": () => this.editor.commands.setHardBreak(),
    };
  },
});
