import styles from "./Grid.module.css";
import DisplayValue from "../DisplayValue";

type Props = {
  entries: any[];
  onUrlClick: Function;
};

export default function Grid({ entries, onUrlClick = () => {} }: Props) {
  const numDays = new Date().get;

  return (
    <div className={styles.grid}>
      {entries.map((e) => (
        <button className={styles.gridItem} onClick={() => onUrlClick(e.id)}>
          {Object.entries(e).map(([key, value]) => (
            <j-flex gap="200" direction="column">
              <j-text size="200" uppercase nomargin>
                {key}
              </j-text>
              <j-text color="black">
                <DisplayValue onUrlClick={onUrlClick} value={value} />
              </j-text>
            </j-flex>
          ))}
        </button>
      ))}
    </div>
  );
}
