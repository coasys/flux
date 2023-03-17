import styles from "./Sprite.module.css";

const getHashArray = (hash: string, colors: string[]): string[] => {
  const results = [];

  for (var i = 0; i < hash.length; i++) {
    const colorIndex = hash.charCodeAt(i) - 97;
    results.push(colors[colorIndex]);
  }

  return results;
};

type Props = {
  hash: string;
  palette: string[];
};

export default function Sprite({ hash, palette }: Props) {
  const hashArray = getHashArray(hash, palette);

  return (
    <div className={styles.canvas}>
      <figure className={styles.frame}>
        {hashArray.map((hex, index) => (
          <div
            className={styles.pixel}
            key={index}
            style={{ background: `#${hex}` }}
          ></div>
        ))}
      </figure>
    </div>
  );
}
