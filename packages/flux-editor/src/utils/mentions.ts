import { BaseEditor } from "slate";
import { ReactEditor } from "slate-react";
import { Transforms } from "slate";

const withMentions = (editor: BaseEditor & ReactEditor) => {
  const { isInline, isVoid, markableVoid } = editor;

  editor.isInline = (element) => {
    return element.type === "mention" ? true : isInline(element);
  };

  editor.isVoid = (element) => {
    return element.type === "mention" ? true : isVoid(element);
  };

  editor.markableVoid = (element) => {
    return element.type === "mention" || markableVoid(element);
  };

  return editor;
};

export type CustomText = {
  bold?: boolean;
  italic?: boolean;
  code?: boolean;
  text: string;
};

export type MentionElement = {
  type: "mention";
  character: string;
  children: CustomText[];
};

const insertMention = (editor: BaseEditor & ReactEditor, character) => {
  const mention: MentionElement = {
    type: "mention",
    character,
    children: [{ text: "" }],
  };
  Transforms.insertNodes(editor, mention);
  Transforms.move(editor);
};

export { withMentions, insertMention };
