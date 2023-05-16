import { BaseEditor } from "slate";
import { ReactEditor } from "slate-react";
import { Transforms } from "slate";
import { Profile } from "@fluxapp/types";

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
  person: Profile;
  children: CustomText[];
};

const insertMention = (editor: BaseEditor & ReactEditor, person) => {
  const mention: MentionElement = {
    type: "mention",
    person,
    children: [{ text: "" }],
  };
  Transforms.insertNodes(editor, mention);
  Transforms.move(editor);
};

export { withMentions, insertMention };
