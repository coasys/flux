import { formatRelative, isSameWeek } from "date-fns/esm";

// in miliseconds
var units = {
  year: 24 * 60 * 60 * 1000 * 365,
  month: (24 * 60 * 60 * 1000 * 365) / 12,
  day: 24 * 60 * 60 * 1000,
  hour: 60 * 60 * 1000,
  minute: 60 * 1000,
  second: 1000,
};

export function getRelativeTime(d1, d2 = new Date(), rtf) {
  var elapsed = d1 - d2;

  // "Math.abs" accounts for both "past" & "future" scenarios
  for (var u in units) {
    if (Math.abs(elapsed) > units[u] || u == "second") {
      return rtf.format(Math.round(elapsed / units[u]), u);
    }
  }
}

export function getTimeSince(d1: Date, d2: Date = new Date()) {
  const dateString = formatRelative(d1, d2, { weekStartsOn: 1 });

  // Remove "last" prefix from date if we're in the same week
  if (isSameWeek(d1, d2, { weekStartsOn: 1 })) {
    return dateString.replace("last ", "");
  }

  return dateString;
}
