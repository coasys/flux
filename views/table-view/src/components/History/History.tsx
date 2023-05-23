import styles from "./History.module.css";
import { useEffect, useState } from "preact/hooks";
import { getEntry } from "../../utils";
import { PerspectiveProxy, Literal } from "@perspect3vism/ad4m";

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
  perspective: PerspectiveProxy;
  source: string;
  onClick: (index: number) => void;
};

function HistoryItem({ source, perspective, onClick }: ItemProps) {
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
    entry?.name ||
    entry?.title ||
    (source?.startsWith("literal://") && Literal.fromUrl(source).get()) ||
    source;

  return (
    <button className={styles.historyItem} onClick={onClick} nomargin>
      {defaultName}
    </button>
  );
}
