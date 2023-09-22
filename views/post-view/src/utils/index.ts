import { formatRelative, isSameWeek } from "date-fns/esm";

export function getTimeSince(d1: Date, d2: Date = new Date()) {
  const dateString = formatRelative(d1, d2, { weekStartsOn: 1 });

  // Remove "last" prefix from date if we're in the same week
  if (isSameWeek(d1, d2, { weekStartsOn: 1 })) {
    return dateString.replace("last ", "");
  }

  return dateString;
}
