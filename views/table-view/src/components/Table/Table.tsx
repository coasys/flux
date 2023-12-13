import { useState, useEffect } from "preact/hooks";
import styles from "./Table.module.css";
import DisplayValue from "../DisplayValue";
import { LinkQuery, PerspectiveProxy, Agent } from "@coasys/ad4m";

type Props = {
  me: null | Agent;
  entries: any[];
  perspective: PerspectiveProxy;
  onUrlClick: (url: string) => void;
  onEntryClick: (url: string) => void;
  subjectClass: string;
};

export default function Table({
  entries,
  me,
  perspective,
  subjectClass,
  onEntryClick = () => {},
  onUrlClick = () => {},
}: Props) {
  const [namedOptions, setNamedOptions] = useState({});
  const [selectedEntries, setSelected] = useState([]);

  useEffect(() => {
    perspective
      .infer(
        `subject_class("${subjectClass}", Atom), property_named_option(Atom, Property, Value, Label).`
      )
      .then((res) => {
        if (res?.length) {
          const options = res.reduce((acc, option) => {
            return {
              ...acc,
              [option.Property]: [
                ...(acc[option.Property] || []),
                { label: option.Label, value: option.Value },
              ],
            };
          }, {});
          setNamedOptions(options);
        }
      });
  }, [subjectClass]);

  const headers = Object.keys(entries[0]).filter((key, index) => {
    return !(key === "id" || key === "author" || key === "timestamp");
  });

  async function onUpdate(id, propName, value) {
    const proxy = await perspective.getSubjectProxy(id, subjectClass);
    await proxy.init();
    const capitalized = propName.charAt(0).toUpperCase() + propName.slice(1);
    proxy[`set${capitalized}`](value);
  }

  function onDelete(id) {
    perspective.get(new LinkQuery({ target: id })).then((links) => {
      perspective.removeLinks(links);
    });
    perspective.get(new LinkQuery({ source: id })).then((links) => {
      perspective.removeLinks(links);
    });
  }

  function onToggleSelect(e) {
    const { checked, value } = e.target;
    if (checked) {
      setSelected([...selectedEntries, value]);
    } else {
      setSelected(selectedEntries.filter((id) => id === value));
    }
  }

  function onDeleteSelected() {
    selectedEntries.forEach((id) => {
      onDelete(id);
    });
  }

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th width="10"></th>
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
          {entries.map((entry, index) => {
            return (
              <tr key={index}>
                <td>
                  <j-flex gap="100">
                    <input
                      onChange={onToggleSelect}
                      name="select"
                      value={entry.id}
                      type="checkbox"
                    />
                    <j-button
                      onclick={() => onUrlClick(entry.id)}
                      circle
                      variant="ghost"
                      square
                      size="xs"
                    >
                      <j-icon
                        style="--j-icon-size: 0.7rem"
                        name="arrows-angle-expand"
                      ></j-icon>
                    </j-button>
                    <j-button
                      onclick={() => onEntryClick(entry.id)}
                      variant="ghost"
                      size="xs"
                    >
                      <j-icon
                        color="primary-400"
                        style="--j-icon-size: 1.2rem"
                        name="arrow-right-circle-fill"
                      ></j-icon>
                    </j-button>
                  </j-flex>
                </td>
                {headers.map((header, index) => {
                  const value = entry[header];
                  return (
                    <td key={index}>
                      <j-popover event="contextmenu">
                        <div className={styles.trigger} slot="trigger">
                          <DisplayValue
                            canEdit={entry.author === me?.did}
                            options={namedOptions[header]}
                            onUrlClick={(url) => onUrlClick(url)}
                            onUpdate={(val) => onUpdate(entry.id, header, val)}
                            value={value}
                          />
                        </div>
                        <j-menu
                          onClick={(e) => e.stopPropagation()}
                          slot="content"
                        >
                          {selectedEntries.length ? (
                            <j-menu-item onClick={onDeleteSelected}>
                              <j-icon
                                name="trash"
                                size="xs"
                                slot="start"
                              ></j-icon>
                              <j-text
                                color="danger-500"
                                size="400"
                                weight="500"
                                nomargin
                              >
                                Delete selected entries
                              </j-text>
                            </j-menu-item>
                          ) : (
                            <j-menu-item onClick={() => onDelete(entry.id)}>
                              <j-icon
                                name="trash"
                                size="xs"
                                slot="start"
                              ></j-icon>
                              <j-text
                                color="danger-500"
                                size="400"
                                weight="500"
                                nomargin
                              >
                                Delete entry
                              </j-text>
                            </j-menu-item>
                          )}
                        </j-menu>
                      </j-popover>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
