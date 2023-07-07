import { useEffect, useState, useRef, useMemo } from "preact/hooks";
import { Literal, PerspectiveProxy } from "@perspect3vism/ad4m";
import styles from "./TableView.module.css";
import { usePrevious, pluralize } from "../../utils";
import { v4 as uuidv4 } from "uuid";

import Table from "../Table";
import Grid from "../Grid";
import Header from "../Header";
import History from "../History";
import Entry from "../Entry";
import NewClass from "../NewClass";
import { useEntries } from "@fluxapp/react-web";

type Props = {
  perspective: PerspectiveProxy;
  source: string;
};

export default function TableView({
  perspective,
  source: initialSource,
}: Props) {
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"grid" | "table">("table");
  const [history, setHistory] = useState([initialSource]);
  const prevHistory = usePrevious(history);
  const [classes, setClasses] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [currentEntry, setCurrentEntry] = useState("");
  const [openNewClass, setOpenNewClass] = useState(false);
  const [openCurrentEntry, setOpenCurrentEntry] = useState(false);
  const layoutRef = useRef();

  const source = history.length ? history[history.length - 1] : "ad4m://self";

  const { entries } = useEntries({ perspective, source, model: selected });

  useEffect(() => {
    const wentBack = history.length < (prevHistory?.length || 0);
    if (wentBack && layoutRef.current) {
      console.log("wentback");
    } else {
      console.log("wentforward");
    }
  }, history);

  useEffect(() => {
    setSelected("");
  }, [perspective?.uuid, initialSource]);

  useEffect(() => {
    setHistory([initialSource]);
  }, [initialSource, perspective.uuid]);

  useEffect(() => {
    perspective.infer(`subject_class(ClassName, C)`).then((result) => {
      if (Array.isArray(result)) {
        const uniqueClasses = [...new Set(result.map((c) => c.ClassName))];
        setClasses(uniqueClasses);
        setSelected(uniqueClasses[0] || "");
      } else {
        setClasses([]);
        setSelected("");
      }
    });
  }, [perspective.uuid]);

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

  const filteredEntries = useMemo(() => {
    if (search === "") return entries;
    return entries.filter((entry) => {
      return Object.values(entry).some(
        (value: any) =>
          typeof value === "string" &&
          value.toLowerCase().includes(search.toLowerCase())
      );
    });
  }, [search, entries]);

  const viewComp = {
    table: () => (
      <Table
        perspective={perspective}
        subjectClass={selected}
        onEntryClick={(url) => onUrlClick(url, true)}
        onUrlClick={(url) => onUrlClick(url, false)}
        entries={filteredEntries}
      ></Table>
    ),
    grid: () => (
      <j-box px="500">
        <Grid
          onUrlClick={(url) => onUrlClick(url, true)}
          entries={filteredEntries}
        ></Grid>
      </j-box>
    ),
  };

  const View = viewComp[view];

  return (
    <>
      <div ref={layoutRef} className={styles.layout}>
        <div className={styles.entry}>
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
        </div>

        <div className={styles.children}>
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

                    <span>{pluralize(c)}</span>
                  </label>
                );
              })}
              <button
                onClick={() => setOpenNewClass(true)}
                className={styles.tab}
              >
                <j-icon name="plus"></j-icon>
              </button>
            </div>
          </j-box>

          <div className={styles.options}>
            <j-popover>
              <j-button size="sm" variant="ghost" slot="trigger">
                View
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
            <j-input
              value={search}
              onInput={(e) => setSearch(e.target.value)}
              size="sm"
              placeholder="Search"
            >
              <j-icon
                name="search"
                color="ui-500"
                style="--j-icon-size: 0.8rem"
                slot="end"
              ></j-icon>
            </j-input>
            <j-button
              onClick={() =>
                createEntry({ perspective, source, subjectClass: selected })
              }
              size="sm"
              variant="secondary"
            >
              New {selected.toLowerCase()}
            </j-button>
          </div>

          {filteredEntries.length > 0 ? (
            <View />
          ) : (
            <j-box px="1000" py="1000">
              <j-flex direction="column" a="center" j="center" gap="500">
                <j-icon size="lg" name="cone-striped"></j-icon>
                <j-text>No {pluralize(selected).toLowerCase()} yet...</j-text>
              </j-flex>
            </j-box>
          )}
        </div>
      </div>

      <j-modal
        size="sm"
        open={openNewClass}
        onToggle={(e) => setOpenNewClass(e.target.open)}
      >
        <j-box p="500">
          <NewClass
            onSaved={() => setOpenNewClass(false)}
            perspective={perspective}
          ></NewClass>
        </j-box>
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
    </>
  );
}

type CreatePops = {
  perspective: PerspectiveProxy;
  subjectClass: string;
  source: string;
};

async function createEntry({ perspective, subjectClass, source }: CreatePops) {
  const uuid = Literal.from(uuidv4()).toUrl();
  const instance = await perspective.createSubject(subjectClass, uuid);

  await instance.init();

  const type = await perspective.add({
    source: source || "ad4m://self",
    predicate: "has_child",
    target: uuid,
  });
}
