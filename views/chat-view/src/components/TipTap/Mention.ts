import { Node, mergeAttributes } from "@tiptap/core";
import { Node as ProseMirrorNode } from "prosemirror-model";
import { PluginKey } from "prosemirror-state";
import Suggestion, { SuggestionOptions } from "@tiptap/suggestion";

export type MentionOptions = {
  name: string;
  HTMLAttributes: Record<string, any>;
  renderLabel: (props: {
    options: MentionOptions;
    node: ProseMirrorNode;
  }) => string;
  suggestion: Omit<SuggestionOptions, "editor">;
};

export default (name: string) =>
  Node.create<MentionOptions>({
    name: name,
    addOptions: () => ({
      name: name,
      HTMLAttributes: {},
      renderLabel({ options, node }) {
        return `${options.suggestion.char}${node.attrs.label ?? node.attrs.id}`;
      },
      suggestion: {
        char: "@",
        pluginKey: new PluginKey(name),
        command: ({ editor, range, props }) => {
          // increase range.to by one when the next node is of type "text"
          // and starts with a space character
          const nodeAfter = editor.view.state.selection.$to.nodeAfter;
          const overrideSpace = nodeAfter?.text?.startsWith(" ");

          if (overrideSpace) {
            range.to += 1;
          }

          editor
            .chain()
            .focus()
            .insertContentAt(range, [
              {
                type: name,
                attrs: props,
              },
              {
                type: "text",
                text: " ",
              },
            ])
            .run();
        },
        allow: ({ editor, range }) => {
          return editor.can().insertContentAt(range, { type: name });
        },
      },
    }),

    group: "inline",

    inline: true,

    selectable: true,

    atom: true,

    addAttributes() {
      return {
        id: {
          default: null,
          parseHTML: (element) => element.getAttribute("data-id"),
          renderHTML: (attributes) => {
            if (!attributes.id) {
              return {};
            }

            return {
              "data-id": attributes.id,
            };
          },
        },

        label: {
          default: null,
          parseHTML: (element) => element.getAttribute("data-label"),
          renderHTML: (attributes) => {
            if (!attributes.label) {
              return {};
            }

            return {
              "data-label": attributes.label,
            };
          },
        },
      };
    },

    parseHTML() {
      return [
        {
          tag: `span[data-mention="${name}"]`,
        },
      ];
    },

    renderHTML({ node, HTMLAttributes }) {
      return [
        "span",
        mergeAttributes(
          { "data-mention": name },
          this.options.HTMLAttributes,
          HTMLAttributes
        ),
        this.options.renderLabel({
          options: this.options,
          node,
        }),
      ];
    },

    renderText({ node }) {
      return this.options.renderLabel({
        options: this.options,
        node,
      });
    },

    addKeyboardShortcuts() {
      return {
        Backspace: () =>
          this.editor.commands.command(({ tr, state }) => {
            let isMention = false;
            const { selection } = state;
            const { empty, anchor } = selection;

            if (!empty) {
              return false;
            }

            state.doc.nodesBetween(anchor - 1, anchor, (node, pos) => {
              if (node.type.name === this.name) {
                isMention = true;
                tr.insertText(
                  this.options.suggestion.char || "",
                  pos,
                  pos + node.nodeSize
                );

                return false;
              }
            });

            return isMention;
          }),
      };
    },

    addProseMirrorPlugins() {
      return [
        Suggestion({
          editor: this.editor,
          ...this.options.suggestion,
        }),
      ];
    },
  });
