import styles from "./Table.module.css";
import DisplayValue from "../DisplayValue";

type Props = {
  entries: any[];
  onUrlClick: Function;
};

export default function Table({ entries, onUrlClick = () => {} }: Props) {
  const headers = Object.keys(entries[0]).filter((header, index) => {
    return header === "id" ? false : true;
  });

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            {headers.map((header, index) => {
              return (
                <th key={index}>
                  <span>{header}</span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {entries.map((item, index) => (
            <tr key={index}>
              {headers.map((header, index) => {
                const value = item[header];
                return (
                  <td key={index} onClick={() => onUrlClick(item.id)}>
                    <DisplayValue value={value} />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
