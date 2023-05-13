import { useEffect, useState } from "preact/hooks";
import { PerspectiveProxy } from "@perspect3vism/ad4m";
import styles from "./TableView.module.css";

type Props = {
  perspective: PerspectiveProxy;
  source: string;
};

export default function TableView({
  perspective,
  source: initialSource,
}: Props) {
  const [history, setHistory] = useState([initialSource]);
  const [classes, setClasses] = useState<string[]>([]);
  const [selected, setSelected] = useState("");

  const source = history.length ? history[history.length - 1] : "ad4m://self";

  useEffect(() => {
    setHistory([initialSource]);
  }, [initialSource]);

  useEffect(() => {
    perspective
      .infer(
        `subject_class(ClassName, C), instance(C, Base), triple( "${source}", _, Base).`
      )
      .then((result) => {
        if (Array.isArray(result)) {
          const uniqueClasses = [...new Set(result.map((c) => c.ClassName))];
          setClasses(uniqueClasses);
          setSelected(uniqueClasses[0] || "");
        } else {
          setClasses([]);
          setSelected("");
        }
      });
  }, [perspective.uuid, history]);

  async function onUrlClick(baseExpression) {
    if (source === baseExpression) return;
    setHistory([...history, baseExpression]);
  }

  async function goTo(index: number) {
    const newHistory = history.slice(0, index);
    setHistory(newHistory);
  }

  return (
    <div>
      <j-box pt="500" px="900">
        <EntryInfo
          perspective={perspective}
          source={source}
          onUrlClick={onUrlClick}
        ></EntryInfo>
      </j-box>

      <j-box px="900" pt="500">
        <div className={styles.history}>
          {history.map((s, index) => {
            return (
              <button
                className={styles.historyItem}
                onClick={() => goTo(index + 1)}
                nomargin
              >
                {generateHash(s)}
              </button>
            );
          })}
        </div>
      </j-box>

      <j-box px="800" pt="500">
        <div className={styles.tabs}>
          {classes.map((c) => {
            return (
              <label className={styles.tab}>
                <input
                  name="subject"
                  onChange={(e) => setSelected(e.target.value)}
                  checked={selected === c}
                  value={c}
                  type="radio"
                ></input>
                <span>{c}</span>
              </label>
            );
          })}
        </div>
      </j-box>
      <j-box px="800">
        <Table
          onUrlClick={onUrlClick}
          perspective={perspective}
          subjectInstance={selected}
          source={source}
        ></Table>
      </j-box>
    </div>
  );
}

type EntryInfoProps = {
  perspective: PerspectiveProxy;
  source: string;
  onUrlClick: Function;
};

function EntryInfo({ perspective, source, onUrlClick }: EntryInfoProps) {
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

  if (entry) {
    const properties = Object.entries(entry);
    const defaultName = entry?.name || entry?.title || source;

    return (
      <div>
        <j-badge size="sm" variant="primary">
          {classes[0]}
        </j-badge>
        <j-box pt="300">
          {defaultName && (
            <j-text nomargin variant="heading-lg">
              {defaultName}
            </j-text>
          )}
        </j-box>
        {/* <j-flex direction="row" gap="600">
          {properties.map(([key, value]) => (
            <j-flex gap="200" direction="column">
              <j-text size="300" uppercase nomargin>
                {key}
              </j-text>
              <div>
                <DisplayValue onUrlClick={onUrlClick} value={value} />
              </div>
            </j-flex>
          ))}
        </j-flex>*/}
      </div>
    );
  }

  return <span>{source}</span>;
}

type TableProps = {
  perspective: PerspectiveProxy;
  subjectInstance: any;
  source: string;
  onUrlClick: Function;
};

function Table({
  perspective,
  subjectInstance,
  source,
  onUrlClick = () => {},
}: TableProps) {
  const [entries, setEntries] = useState<any[]>([]);

  useEffect(() => {
    if (subjectInstance) {
      console.log({ subjectInstance, source });
      perspective
        .infer(
          `subject_class("${subjectInstance}", C), instance(C, Base), triple( "${source}", _, Base).`
        )
        .then(async (result) => {
          if (result) {
            const entries = await Promise.all(
              result.map((r) =>
                perspective.getSubjectProxy(r.Base, subjectInstance)
              )
            );
            const resolved = await getEntries(entries);
            setEntries(resolved);
          } else {
            setEntries([]);
          }
        })
        .catch((e) => {
          setEntries([]);
        });
    } else {
      setEntries([]);
    }
  }, [subjectInstance, perspective.uuid, source]);

  if (!entries?.length) return null;
  // Extracting the property names from the first object in the array
  const headers = Object.keys(entries[0]);

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            {headers
              .filter(
                (header, index) =>
                  header !== "id" || !Array.isArray(entries[0][header])
              )
              .map((header, index) => {
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
              {headers
                .filter((header) => header !== "id")
                .map((header, index) => {
                  const value = item[header];
                  return (
                    <td key={index} onClick={() => onUrlClick(item.id)}>
                      <DisplayValue onUrlClick={onUrlClick} value={value} />
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

type DisplayValueProps = {
  value: any;
  onUrlClick: Function;
};

function DisplayValue({ value, onUrlClick }: DisplayValueProps) {
  const isCollection = Array.isArray(value);

  if (isCollection) {
    return null;
    // return (
    //   <j-flex gap="200" wrap>
    //     {value.map((v, index) => {
    //       return <DisplayValue onUrlClick={onUrlClick} value={v} />;
    //     })}
    //   </j-flex>
    // )
  }

  if (typeof value === "string") {
    if (value.length > 200)
      return (
        <img className={styles.img} src={`data:image/png;base64,${value}`} />
      );
    if (value.includes("://")) {
      return (
        <a
          className={styles.entryUrl}
          href={value}
          onClick={() => onUrlClick(value)}
        >
          {generateHash(value)}
        </a>
      );
    }

    if (value.includes("did:key")) {
      return (
        <div>
          <j-avatar size="xs" hash={value}></j-avatar>
        </div>
      );
    }
    return <span>{value}</span>;
  }

  if (value?.constructor?.name === "Object") {
    return <ShowObjectInfo value={value} />;
  }

  return value === null ? (
    <span>null</span>
  ) : value === false ? (
    <span>false</span>
  ) : (
    value
  );
}

function ShowObjectInfo({ value }) {
  const [open, setOpen] = useState(false);

  const properties = Object.entries(value);

  function onClick(e) {
    e.stopPropagation();
    setOpen(true);
  }

  return (
    <div>
      <j-button variant="primary" size="xs" onClick={onClick}>
        Show more
      </j-button>
      {open && (
        <j-modal open={open} onToggle={(e) => setOpen(e.target.open)}>
          <j-box p="500">
            <j-flex p="500" direction="column" gap="400">
              {properties.map(([key, value]) => (
                <j-flex gap="100" direction="column">
                  <j-text size="300" uppercase nomargin>
                    {key}
                  </j-text>
                  <DisplayValue value={value} />
                </j-flex>
              ))}
            </j-flex>
          </j-box>
        </j-modal>
      )}
    </div>
  );
}

async function getEntry(entry) {
  const getters = Object.entries(Object.getOwnPropertyDescriptors(entry))
    .filter(([key, descriptor]) => typeof descriptor.get === "function")
    .map(([key]) => key);

  const promises = getters.map((getter) => entry[getter]);
  return Promise.all(promises).then((values) => {
    return getters.reduce((acc, getter, index) => {
      return { ...acc, id: entry.baseExpression, [getter]: values[index] };
    }, {});
  });
}

async function getEntries(entries) {
  return Promise.all(entries.map(getEntry));
}

function generateHash(str: string): string {
  return str;
  let hash = Array.from(str).reduce(
    (prevHash, currChar) => (prevHash << 5) - prevHash + currChar.charCodeAt(0),
    0
  );
  return hash.toString(36).substr(2, 8);
}
