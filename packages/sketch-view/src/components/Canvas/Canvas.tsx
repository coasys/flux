import styles from "./Canvas.module.css";

function Canvas({ lines }) {
  console.log(lines);
  return (
    <svg
      className={styles.canvas}
      viewBox={`0 0 ${1920} ${1080}`}
      preserveAspectRatio="xMinYMin meet"
    >
      {lines
        .filter((l) => l.length > 0)
        .map((line, index) => (
          <CanvasLine key={index} line={line} />
        ))}
    </svg>
  );
}

function CanvasLine({ line }) {
  const pathData =
    "M " +
    line
      .map((p) => {
        return `${p.x} ${p.y}`;
      })
      .join(" L ");

  return <path className={styles.path} d={pathData} />;
}

export default Canvas;
