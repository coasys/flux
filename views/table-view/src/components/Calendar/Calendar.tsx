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
    return new Date(year, month, 0).toLocaleString("default", {
      month: "long",
    });
  }, [month, year]);

  const dayArray = [...Array(numDays).keys()];

  const currentYear = new Date().getFullYear();

  return (
    <div className={styles.calendar}>
      <j-box pb="500">
        <j-flex a="center" j="between" gap="200">
          <j-text size="600" weight="600" color="ui-500">
            {monthName}
          </j-text>
          <j-flex gap="200" a="center">
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className={styles.select}
            >
              {[...Array(40).keys()].map((i) => {
                return <option>{currentYear - i}</option>;
              })}
            </select>
            <j-button
              onClick={() => setMonth((month - 1) % 12)}
              size="sm"
              variant="primary"
            >
              Previous
            </j-button>
            <j-button
              onClick={() => setMonth((month + 1) % 12)}
              size="sm"
              variant="primary"
            >
              Next
            </j-button>
          </j-flex>
        </j-flex>
      </j-box>
      <div className={styles.grid}>
        {dayArray.map((i) => {
          const entriesInDay = entries.filter(
            (e) =>
              new Date(e.timestamp).getDay() === i + 1 &&
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
