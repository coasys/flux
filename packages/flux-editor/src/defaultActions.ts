const defaultActions = [
  { name: "bold", command: "toggleBold", icon: "type-bold", disable: true },
  {
    name: "italic",
    command: "toggleItalic",
    icon: "type-italic",
    disable: true,
  },
  {
    name: "strike",
    command: "toggleStrike",
    icon: "type-strikethrough",
    disable: true,
  },
  {
    name: "bulletList",
    command: "toggleBulletList",
    icon: "list-ul",
    disable: true,
  },
  {
    name: "orderedList",
    command: "toggleOrderedList",
    icon: "list-ol",
    disable: true,
  },
  {
    name: "codeBlock",
    command: "toggleCodeBlock",
    icon: "braces",
    disable: true,
  },
  { name: "blockquote", command: "toggleBlockquote", icon: "quote" },
];

export default defaultActions;
