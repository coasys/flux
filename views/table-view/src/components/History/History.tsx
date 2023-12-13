import styles from "./History.module.css";
import { useEffect, useState } from "preact/hooks";
import { getEntry } from "../../utils";
import { PerspectiveProxy, Literal } from "@coasys/ad4m";

type Props = {
  perspective: PerspectiveProxy;
  history: string[];
  onClick: (index: number) => void;
};

export default function History({ perspective, history, onClick }: Props) {
  return (
    history.length > 1 && (
      <div className={styles.history}>
        {history.map((s, index) => {
          return (
            <HistoryItem
              isLast={history.length === index + 1}
              source={s}
              onClick={() => onClick(index + 1)}
              perspective={perspective}
            ></HistoryItem>
          );
        })}
      </div>
    )
  );
}

type ItemProps = {
  isLast: boolean;
  perspective: PerspectiveProxy;
  source: string;
  onClick: (index: number) => void;
};

function HistoryItem({ isLast, source, perspective, onClick }: ItemProps) {
  const [entry, setEntry] = useState({});
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    fetchSourceClasses(source);
  }, [source, perspective.uuid]);

  async function fetchSourceClasses(source) {
    const classResults = await perspective.infer(
      `subject_class(ClassName, C), instance(C, "${source}").`
    );

    if (classResults?.length > 0) {
      setClasses(classResults.map((c) => c.ClassName));
      const className = classResults[0].ClassName;
      const subjectProxy = await perspective.getSubjectProxy(source, className);
      const entry = await getEntry(subjectProxy);
      setEntry(entry);
    } else {
      setClasses([]);
      setEntry({ id: source });
    }
  }

  const defaultName =
    classes[0] ||
    entry?.name ||
    entry?.title ||
    (source?.startsWith("literal://") && Literal.fromUrl(source).get()) ||
    source;

  const title =
    entry?.name ||
    entry?.title ||
    (source?.startsWith("literal://") && Literal.fromUrl(source).get()) ||
    source;

  return (
    <>
      <j-tooltip title={title} placement="bottom">
        <button
          className={`${styles.historyItem} ${isLast && styles.isLast}`}
          onClick={onClick}
          nomargin
        >
          {defaultName}
        </button>
      </j-tooltip>
      {!isLast && <j-icon size="xs" name="chevron-right"></j-icon>}
    </>
  );
}
