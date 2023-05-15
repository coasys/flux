import { useEffect, useState, useRef } from "preact/hooks";
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
  const [view, setView] = useState<"grid" | "table">("table");
  const [history, setHistory] = useState([initialSource]);
  const prevHistory = usePrevious(history);
  const [classes, setClasses] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [currentEntry, setCurrentEntry] = useState("");
  const [openCurrentEntry, setOpenCurrentEntry] = useState(false);

  const source = history.length ? history[history.length - 1] : "ad4m://self";

  const { entries } = useChildren({
    perspective,
    source,
    subjectInstance: selected,
  });

  useEffect(() => {
    const wentBack = history.length < (prevHistory?.length || 0);
    if (wentBack) {
    }
  }, history);

  useEffect(() => {
    setSelected("");
  }, [perspective?.uuid, initialSource]);

  useEffect(() => {
    setHistory([initialSource]);
  }, [initialSource, perspective.uuid]);

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

  async function onUrlClick(baseExpression: string, useHistory: boolean) {
    setCurrentEntry(baseExpression);
    if (useHistory) {
      if (baseExpression !== source) {
        setHistory([...history, baseExpression]);
      }
      setOpenCurrentEntry(false);
    } else {
      setOpenCurrentEntry(true);
    }
  }

  async function goTo(index: number) {
    const newHistory = history.slice(0, index);
    setHistory(newHistory);
  }

  const viewComp = {
    table: () => <Table onUrlClick={onUrlClick} entries={entries}></Table>,
    grid: () => (
      <j-box px="500">
        <Grid onUrlClick={onUrlClick} entries={entries}></Grid>
      </j-box>
    ),
  };

  const View = viewComp[view];

  return (
    <div>
      <j-box bg="primary-500" pt="500" pb="500" px="500">
        {history.length > 1 && (
          <div className={styles.history}>
            {history.map((s, index) => {
              return (
                <button
                  className={styles.historyItem}
                  onClick={() => goTo(index + 1)}
                  nomargin
                >
                  {s}
                </button>
              );
            })}
          </div>
        )}
        <Header
          perspective={perspective}
          source={source}
          onUrlClick={onUrlClick}
        ></Header>
      </j-box>

      <j-box bg="primary-500" px="500">
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

      <j-box px="500" py="300">
        {entries.length > 0 && (
          <j-flex gap="500">
            <j-popover>
              <j-button size="sm" variant="ghost" slot="trigger">
                Grid
                <j-icon slot="end" name="chevron-down" size="xs"></j-icon>
              </j-button>
              <j-menu
                value={view}
                onClick={(e) => setView(e.target.value)}
                size="sm"
                slot="content"
              >
                <j-menu-item
                  size="sm"
                  value="table"
                  selected={view === "table"}
                >
                  Table
                </j-menu-item>
                <j-menu-item size="sm" value="grid" selected={view === "grid"}>
                  Grid
                </j-menu-item>
              </j-menu>
            </j-popover>
            <j-input size="sm" placeholder="Search">
              <j-icon name="search" size="xs" slot="end"></j-icon>
            </j-input>
          </j-flex>
        )}
      </j-box>

      <j-box>
        {entries.length > 0 ? (
          <View />
        ) : (
          <j-box px="500">
            <j-text>No entries here</j-text>
          </j-box>
        )}
      </j-box>

      <j-modal
        open={openCurrentEntry}
        onToggle={(e) => setOpenCurrentEntry(e.target.open)}
      >
        <j-box p="500">
          <Entry
            perspective={perspective}
            source={currentEntry}
            onUrlClick={(url) => onUrlClick(url, true)}
          ></Entry>
        </j-box>
      </j-modal>
    </div>
  );
}

type HeaderProps = {
  perspective: PerspectiveProxy;
  source: string;
  onUrlClick?: Function;
};

function Header({ perspective, source, onUrlClick = () => {} }: HeaderProps) {
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
      console.log({ subjectProxy, entry });
      setEntry(entry);
    } else {
      setClasses([]);
      setEntry({ id: source });
    }
  }

  if (entry) {
    const defaultName = entry?.name || entry?.title || source;

    return (
      <div>
        <j-button variant="subtle" onclick={() => onUrlClick(source)}>
          <j-text nomargin variant="heading" color="white">
            {defaultName}
          </j-text>
          <j-icon
            color="white"
            size="xs"
            slot="end"
            name="arrows-angle-expand"
          ></j-icon>
        </j-button>
      </div>
    );
  }

  return <span>{source}</span>;
}

function Entry({ perspective, source, onUrlClick = () => {} }: HeaderProps) {
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
      setClasses([...new Set(classResults.map((c) => c.ClassName))]);
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
    const properties = Object.entries(entry).filter(
      ([key, value]) => key !== "id"
    );
    const defaultName = entry?.name || entry?.title || source;

    return (
      <div>
        <j-flex gap="200" direction="column">
          <j-text color="primary-500" uppercase weight="bold" size="300">
            {classes.toString()}
          </j-text>
        </j-flex>
        <j-box pt="100" pb="800">
          <h2
            className={styles.entryTitle}
            onClick={() => onUrlClick(source, true)}
          >
            {defaultName}
          </h2>
        </j-box>

        <j-flex direction="column" gap="400">
          {properties.map(([key, value]) => (
            <j-flex gap="200" direction="column">
              <j-text size="200" uppercase nomargin>
                {key}
              </j-text>
              <j-text>
                <DisplayValue onUrlClick={onUrlClick} value={value} />
              </j-text>
            </j-flex>
          ))}
        </j-flex>
      </div>
    );
  }

  return <span>{source}</span>;
}

type TableProps = {
  entries: any[];
  onUrlClick: Function;
};

function Table({ entries, onUrlClick = () => {} }: TableProps) {
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

type GridProps = {
  entries: any[];
  onUrlClick: Function;
};

function Grid({ entries, onUrlClick = () => {} }: GridProps) {
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

type DisplayValueProps = {
  value: any;
  onUrlClick?: Function;
};

function DisplayValue({ value, onUrlClick = () => {} }: DisplayValueProps) {
  const isCollection = Array.isArray(value);

  if (isCollection) {
    return (
      <j-flex gap="200" wrap>
        {value.map((v, index) => {
          return <DisplayValue onUrlClick={onUrlClick} value={v} />;
        })}
      </j-flex>
    );
  }

  if (typeof value === "string") {
    if (value.length > 1000)
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
          {value}
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

  if (value === true) return <j-toggle size="sm" checked></j-toggle>;

  if (value === false) return <span></span>;

  return value === null ? <span></span> : value;
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
      <j-button variant="subtle" size="xs" onClick={onClick}>
        Show
      </j-button>
      {open && (
        <j-modal
          open={open}
          onClick={(e) => e.stopImmediatePropagation()}
          onToggle={(e) => setOpen(e.target.open)}
        >
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

function usePrevious(value) {
  const ref = useRef();
  useEffect(() => {
    ref.current = value; //assign the value of ref to the argument
  }, [value]); //this code will run when the value of 'value' changes
  return ref.current; //in the end, return the current ref value.
}

type UseEntryProps = {
  perspective: PerspectiveProxy;
  subjectInstance: string;
  source: string;
};

function useChildren({ perspective, subjectInstance, source }: UseEntryProps) {
  const [entries, setEntries] = useState<any[]>([]);

  useEffect(() => {
    if (subjectInstance) {
      perspective
        .infer(
          `subject_class("${subjectInstance}", C), instance(C, Base), triple( "${source}", _, Base).`
        )
        .then(async (result) => {
          if (result) {
            console.log({ result });
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

  return { entries };
}
