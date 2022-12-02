export enum DisplayView {
  Compact = "COMPACT",
  Grid = "GRID",
  Card = "CARD",
}

export enum PostOption {
  Text = "TEXT",
  Image = "IMAGE",
  Link = "LINK",
  Event = "EVENT",
}

export const postOptions = [
  {
    label: "Post",
    value: PostOption.Text,
    icon: "card-heading",
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
  {
    label: "Event",
    value: PostOption.Event,
    icon: "calendar-date",
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
