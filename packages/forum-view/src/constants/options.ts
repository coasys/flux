export enum DisplayView {
  Compact = "COMPACT",
  Grid = "GRID",
  Card = "CARD",
}

export enum PostOption {
  Text = "TEXT",
  Image = "IMAGE",
  Link = "LINK",
}

export const postOptions = [
  {
    label: "Text",
    value: PostOption.Text,
    icon: "justify-left",
  },
  {
    label: "Image",
    value: PostOption.Image,
    icon: "card-image",
  },
  {
    label: "Link",
    value: PostOption.Link,
    icon: "link",
  },
];

export const displayOptions = [
  {
    label: "Compact",
    value: DisplayView.Compact,
    icon: "list",
  },
  {
    label: "Grid",
    value: DisplayView.Grid,
    icon: "grid",
  },
  {
    label: "Card",
    value: DisplayView.Card,
    icon: "card-heading",
  },
];
