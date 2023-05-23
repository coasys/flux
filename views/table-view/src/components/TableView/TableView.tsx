import { useEffect, useState, useRef } from "preact/hooks";
import { Literal, PerspectiveProxy } from "@perspect3vism/ad4m";
import styles from "./TableView.module.css";
import { usePrevious, useChildren } from "../../utils";

import Table from "../Table";
import Grid from "../Grid";
import Header from "../Header";
import History from "../History";
import Entry from "../Entry";

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
  const [showCreate, setShowCreate] = useState(false);

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
        <History
          perspective={perspective}
          history={history}
          onClick={goTo}
        ></History>
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
            <j-button size="sm" variant="primary">
              New {selected}
            </j-button>
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

      <j-modal open={showCreate} onToggle={(e) => setShowCreate(e.target.open)}>
        <CreateEntry
          perspective={perspective}
          source={currentEntry}
          subjectInstance={selected}
        ></CreateEntry>
      </j-modal>

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

function CreateEntry() {
  return <div>Hello</div>;
}
