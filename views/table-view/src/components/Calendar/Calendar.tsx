import styles from "./Calendar.module.css";
import DisplayValue from "../DisplayValue";
import { useMemo, useState } from "preact/hooks";

type Props = {
  entries: any[];
  onEntryClick: Function;
};

export default function Calendar({ entries, onEntryClick = () => {} }: Props) {
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());

  const numDays = useMemo(() => {
    return getDaysInCurrentMonth(year, month);
  }, [month, year]);

  const monthName = useMemo(() => {
    return new Date(year, month + 1, 0).toLocaleString("default", {
      month: "long",
    });
  }, [month, year]);

  const dayArray = [...Array(numDays).keys()];

  const currentYear = new Date().getFullYear();

  console.log({ entries });

  return (
    <div className={styles.calendar}>
      <j-box pb="500">
        <j-flex a="center" j="between" gap="200">
          <j-flex gap="200" a="center">
            <j-button
              onClick={() => setMonth((month - 1) % 12)}
              size="sm"
              variant="ghost"
              square
            >
              <j-icon size="sm" name="chevron-left"></j-icon>
            </j-button>
            <j-button
              onClick={() => setMonth((month + 1) % 12)}
              size="sm"
              square
              variant="ghost"
            >
              <j-icon size="sm" name="chevron-right"></j-icon>
            </j-button>
            <j-text nomargin size="600" weight="600" color="ui-500">
              {monthName} {currentYear}
            </j-text>
          </j-flex>

          <j-flex gap="200" a="center">
            <j-text variant="label" nomargin>
              Sort by
            </j-text>
            <select value={"createdAt"} className={styles.select}>
              <option disabled selected>
                Select property
              </option>
              <option value="createdAt">timestamp</option>
            </select>
          </j-flex>
        </j-flex>
      </j-box>
      <div className={styles.grid}>
        {dayArray.map((i) => {
          const entriesInDay = entries.filter(
            (e) =>
              new Date(e.timestamp).getDate() === i + 1 &&
              new Date(e.timestamp).getMonth() === month &&
              new Date(e.timestamp).getFullYear() === year
          );

          return (
            <div className={styles.gridItem}>
              <j-text>{i + 1}</j-text>
              <j-flex direction="column" gap="200">
                {entriesInDay.map((entry) => {
                  return (
                    <div
                      onClick={() => onEntryClick(entry.id)}
                      className={styles.entry}
                    >
                      {entry.title || entry.name || entry.id}
                    </div>
                  );
                })}
              </j-flex>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getDaysInCurrentMonth(year: number, month: number): number {
  // To get the number of days in the current month, set the day to 0 in the next month
  const lastDayOfMonth = new Date(year, month + 1, 0);

  return lastDayOfMonth.getDate();
}
