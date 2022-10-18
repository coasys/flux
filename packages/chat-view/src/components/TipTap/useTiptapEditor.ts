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

import Mention from "./Mention";
import LineBreak from "./LineBreak";
import renderMention from "./renderMention";

import emojiList from "node-emoji/lib/emoji";

import styles from "./index.scss";
import { NeighbourhoddLink } from "./NeighourhoodPlugin";
import HardBreak from "@tiptap/extension-hard-break";
import { useEffect, useRef } from "preact/hooks";

export default ({value, onSend, members, channels, onChange, perspectiveUuid, channelId}) => {
  // This is needed because React ugh.
  const sendCB = useRef(onSend);
  const membersCB = useRef(members);
  const channelsCB = useRef(channels);
  useEffect(() => {
    sendCB.current = onSend;
  }, [onSend]);
  useEffect(() => {
    membersCB.current = members;
  }, [members]);
  useEffect(() => {
    channelsCB.current = channels;
  }, [channels]);

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
            };
          },
        }),
        Text,
        Paragraph.configure({
          HTMLAttributes: {
            class: styles.editorParagraph,
          },
        }),
        Link,
        NeighbourhoddLink,
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
        Mention("neighbourhood-mention").configure({
          HTMLAttributes: {
            class: styles.editorMentions,
          },
          renderLabel({ options, node }) {
            return `${options.suggestion.char}${
              node.attrs.label ?? node.attrs.id
            }`;
          },
          suggestion: {
            char: "#",
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
        Mention("agent-mention").configure({
          HTMLAttributes: {
            class: styles.editorMentions,
          },
          renderLabel({ options, node }) {
            return `${options.suggestion.char}${
              node.attrs.label ?? node.attrs.id
            }`;
          },
          suggestion: {
            char: "@",
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
    [membersCB, channelsCB, perspectiveUuid, channelId]
  );

  return editor;
};
