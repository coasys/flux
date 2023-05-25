import styles from "./Table.module.css";
import DisplayValue from "../DisplayValue";
import { PerspectiveProxy } from "@perspect3vism/ad4m";

type Props = {
  entries: any[];
  perspective: PerspectiveProxy;
  onUrlClick: (url: string) => void;
  onEntryClick: (url: string) => void;
  subjectClass: string;
};

export default function Table({
  entries,
  perspective,
  subjectClass,
  onEntryClick = () => {},
  onUrlClick = () => {},
}: Props) {
  const headers = Object.keys(entries[0]).filter((header, index) => {
    return header === "id" ? false : true;
  });

  async function onUpdate(id, propName, value) {
    const proxy = await perspective.getSubjectProxy(id, subjectClass);
    await proxy.init();
    const capitalized = propName.charAt(0).toUpperCase() + propName.slice(1);
    proxy[`set${capitalized}`](value);
  }

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
                  <td key={index} onClick={() => onEntryClick(item.id)}>
                    <DisplayValue
                      onUrlClick={(url) => onUrlClick(url)}
                      onUpdate={(val) => onUpdate(item.id, header, val)}
                      value={value}
                    />
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
