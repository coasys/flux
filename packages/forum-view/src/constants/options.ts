import { EntryType } from "utils/types";
export enum DisplayView {
  Grid = "GRID",
  Card = "CARD",
  Compact = "COMPACT",
}

export const postOptions = [
  {
    label: "Post",
    value: EntryType.SimplePost,
    icon: "card-heading",
  },
  {
    label: "Image",
    value: EntryType.ImagePost,
    icon: "card-image",
  },
  {
    label: "Link",
    value: EntryType.LinkPost,
    icon: "link",
  },
  {
    label: "Event",
    value: EntryType.CalendarEvent,
    icon: "calendar-date",
  },
];

export const displayOptions = [
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
  {
    label: "Compact",
    value: DisplayView.Compact,
    icon: "list",
  },
];
