import { useEditor, findParentNode, getNodeType, isList } from "@tiptap/react";
import BulletList from "@tiptap/extension-bullet-list";
import ListItem from "@tiptap/extension-list-item";
import Text from "@tiptap/extension-text";
import Italic from "@tiptap/extension-italic";
import Bold from "@tiptap/extension-bold";
import Strike from "@tiptap/extension-strike";
import Paragraph from "@tiptap/extension-paragraph";
import Document from "@tiptap/extension-document";
import CodeBlock from "@tiptap/extension-code-block";
import History from "@tiptap/extension-history";
import Link from "@tiptap/extension-link";
import OrderedList from "@tiptap/extension-ordered-list";
import { PluginKey } from "prosemirror-state";

import Mention from "./Mention";
import LineBreak from "./LineBreak";
import renderMention from "./renderMention";

import emojiList from "node-emoji/lib/emoji";

import styles from "./index.module.css";
import HardBreak from "@tiptap/extension-hard-break";
import { useEffect, useRef } from "preact/hooks";

// ! Fix for an error with posemirror in react strict-mode
import { EditorView } from "prosemirror-view";
EditorView.prototype.updateState = function updateState(state) {
  if (!this.docView) return; // This prevents the matchesNode error on hot reloads
  this.updateStateInner(state, this.state.plugins != state.plugins);
};

export default ({
  value,
  onSend,
  members,
  channels,
  onChange,
  perspectiveUuid,
  channelId,
  currentMessageEdit,
  onMessageEdit,
}) => {
  // This is needed because React ugh.
  const sendCB = useRef(onSend);
  const membersCB = useRef(members);
  const channelsCB = useRef(channels);
  const onMessageEditCB = useRef(onMessageEdit);
  useEffect(() => {
    sendCB.current = onSend;
  }, [onSend]);
  useEffect(() => {
    membersCB.current = members;
  }, [members]);
  useEffect(() => {
    channelsCB.current = channels;
  }, [channels]);
  useEffect(() => {
    onMessageEditCB.current = onMessageEdit;
  }, [onMessageEdit]);

  const editor = useEditor(
    {
      content: value as any,
      enableInputRules: false,
      autofocus: true,
      editorProps: {
        attributes: {
          style: "outline: 0",
        },
      },
      extensions: [
        LineBreak,
        Document.extend({
          addKeyboardShortcuts: () => {
            return {
              Enter: (props) => {
                const { state, commands } = props.editor;
                const listNodeType = getNodeType("listItem", state.schema);

                const executedCommand = commands.first([
                  (props) => {
                    if (
                      state.selection.$anchor.node().textContent.length <= 0
                    ) {
                      const parentList = findParentNode((node) =>
                        isList(
                          node.type.name,
                          props.editor.extensionManager.extensions
                        )
                      )(state.selection);

                      if (parentList) {
                        return props.commands.toggleList(
                          parentList.node.type,
                          listNodeType
                        );
                      }
                    }

                    return props.commands.splitListItem(listNodeType);
                  },
                ]);

                if (!executedCommand) {
                  const value = props.editor.getHTML();
                  sendCB.current(value);

                  return true;
                }

                // Prevents us from getting a new paragraph if user pressed Enter
                return false;
              },
              ArrowUp: (props) => {
                const value = props.editor.getText() as any;

                if (value.length === 0) {
                  onMessageEditCB.current();
                }

                return false;
              },
            };
          },
        }),
        Text,
        Paragraph,
        Link.configure({
          protocols: ["neighbourhood"],
        }),
        Bold,
        Strike,
        Italic,
        ListItem,
        BulletList,
        OrderedList,
        History,
        CodeBlock,
        HardBreak.configure({
          keepMarks: false,
        }),
        Mention("emoji").configure({
          HTMLAttributes: {
            class: "emoji",
          },
          renderLabel({ options, node }) {
            return node.attrs.label ?? node.attrs.id;
          },
          suggestion: {
            char: ":",
            pluginKey: new PluginKey("emoji"),
            items: ({ query }) => {
              const formattedEmojiList = Object.entries(emojiList.emoji).map(
                ([id, label]) => ({ id, label })
              );

              return formattedEmojiList
                .filter((e) => e.id.startsWith(query))
                .slice(0, 10);
            },
            render: () => renderMention(perspectiveUuid, channelId),
          },
        }),
        Mention("channel").configure({
          renderLabel({ options, node }) {
            return `${options.suggestion.char}${
              node.attrs.label ?? node.attrs.id
            }`;
          },
          suggestion: {
            char: "#",
            pluginKey: new PluginKey("channel"),
            items: ({ query }) => {
              return channelsCB.current
                .filter((item) =>
                  item.label.toLowerCase().startsWith(query.toLowerCase())
                )
                .slice(0, 5);
            },
            render: () => renderMention(perspectiveUuid, channelId),
          },
        }),
        Mention("agent").configure({
          renderLabel({ options, node }) {
            return `${options.suggestion.char}${
              node.attrs.label ?? node.attrs.id
            }`;
          },
          suggestion: {
            char: "@",
            pluginKey: new PluginKey("agent"),
            items: ({ query }) => {
              return membersCB.current
                .filter((item) =>
                  item.label.toLowerCase().startsWith(query.toLowerCase())
                )
                .slice(0, 5);
            },
            render: () => renderMention(perspectiveUuid, channelId),
          },
        }),
      ],
      onUpdate: (props) => {
        const value = props.editor.getJSON() as any;
        onChange(value);
      },
    },
    [
      membersCB,
      channelsCB,
      perspectiveUuid,
      channelId,
      currentMessageEdit,
      onMessageEditCB,
    ]
  );

  useEffect(() => {
    if (value && currentMessageEdit) {
      const text = editor.getText();

      setTimeout(() => {
        editor
          .chain()
          .focus()
          .setTextSelection(text.length + 1)
          .run();
      }, 0);
    }
  }, [value, currentMessageEdit, editor]);

  return editor;
};
