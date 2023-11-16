import { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import styles from "./Board.module.css";
import { useEntries } from "@fluxapp/react-web";
import { useEffect, useMemo } from "preact/hooks";
import { PerspectiveProxy } from "@perspect3vism/ad4m";
import Card from "../Card";
import CardDetails from "../CardDetails";
import { AgentClient } from "@perspect3vism/ad4m/lib/src/agent/AgentClient";

// @ts-ignore
import taskSDNA from "./Task.pl?raw";

type BoardProps = {
  perspective: PerspectiveProxy;
  source: string;
  agent: AgentClient;
};

type NamedOption = {
  value: string;
  label: string;
};

type NamedOptions = Record<string, NamedOption[]>;

export default function Board({ perspective, source, agent }: BoardProps) {
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [columnName, setColumnName] = useState("");
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedProperty, setSelectedProperty] = useState("");
  const [namedOptions, setNamedOptions] = useState<NamedOptions>({});
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    perspective.infer(`subject_class("Task", Atom)`).then((hasTask) => {
      if (!hasTask) {
        perspective
          .addSdna(taskSDNA)
          .then(() => getClasses(perspective, source).then(setClasses));
      }
    });
  }, [perspective.uuid]);

  const { entries, repo } = useEntries({
    perspective,
    source,
    subject: selectedClass,
  });

  function loadColumns() {
    getNamedOptions(perspective, selectedClass).then((namedOpts) => {
      setNamedOptions(namedOpts);
      Object.keys(namedOpts).forEach((key, index) => {
        if (index === 0) {
          setSelectedProperty(key);
        }
      });
    });
  }

  useEffect(() => {
    setSelectedClass(classes[0] || "");
  }, [classes.length]);

  useEffect(() => {
    setTasks(entries);
  }, [JSON.stringify(entries), perspective.uuid]);

  useEffect(() => {
    getClasses(perspective, source).then((classes) => {
      setClasses(classes);
    });
  }, [perspective.uuid, selectedClass]);

  useEffect(() => {
    loadColumns();
  }, [perspective.uuid, selectedClass]);

  const data = useMemo(() => {
    return transformData(
      tasks,
      selectedProperty,
      namedOptions[selectedProperty] || []
    );
  }, [JSON.stringify(tasks), selectedProperty, perspective.uuid, namedOptions]);

  function createNewTodo(propertyName, value) {
    repo.create({ [propertyName]: value });
  }

  const onDragEnd = (result) => {
    const { destination, source, draggableId } = result;

    // If there is no destination, do not do anything
    if (!destination) {
      return;
    }

    // If the draggable is dropped in its original position, do not do anything
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const status = destination.droppableId;

    setTasks((oldTasks) => {
      return oldTasks.map((t) =>
        t.id === draggableId ? { ...t, [selectedProperty]: status } : t
      );
    });

    repo.update(draggableId, { [selectedProperty]: status });
  };

  async function addColumn() {
    const res = await perspective.infer(
      `subject_class("${selectedClass}", Atom)`
    );

    if (res?.length) {
      const atom = res[0].Atom;
      await perspective.addSdna(
        `property_named_option(${atom}, "${selectedProperty}", "${columnName}", "${columnName}").`
      );
      loadColumns();
    }

    setColumnName("");
    setShowAddColumn(false);
  }

  return (
    <>
      <j-box pb="500">
        <j-flex gap="300">
          <select
            placeholder="Select a class"
            className={styles.select}
            onChange={(e) => setSelectedClass(e.target.value)}
            value={selectedClass}
          >
            <option disabled selected>
              Select type
            </option>
            {classes.map((className) => (
              <option value={className}>{className}</option>
            ))}
          </select>
          <select
            className={styles.select}
            onChange={(e) => setSelectedProperty(e.target.value)}
          >
            {Object.keys(namedOptions).map((property) => (
              <option value={property}>{property}</option>
            ))}
          </select>
        </j-flex>
      </j-box>
      <div className={styles.board}>
        <div className={styles.columns}>
          <DragDropContext onDragEnd={onDragEnd}>
            {data.columnOrder.map((columnId, index) => {
              const column = data.columns[columnId];
              const tasks = column.taskIds.map((taskId) => data.tasks[taskId]);

              return (
                <div key={index} className={styles.column}>
                  <header className={styles.columnHeader}>
                    <j-text nomargin size="500" weight="600" color="black">
                      {column.title}
                    </j-text>
                  </header>
                  <div className={styles.columnContent}>
                    <Droppable droppableId={columnId}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`${styles.tasks} ${
                            snapshot.isDraggingOver ? styles.isDraggingOver : ""
                          }`}
                        >
                          {tasks.map((task, index) => (
                            <Draggable
                              key={task.id}
                              draggableId={task.id}
                              index={index}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`${styles.task} ${
                                    snapshot.isDragging ? styles.isDragging : ""
                                  }`}
                                >
                                  <Card
                                    perspective={perspective}
                                    selectedClass={selectedClass}
                                    onClick={() => setCurrentTaskId(task.id)}
                                    id={task.id}
                                  ></Card>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </div>
                  <footer className={styles.columnFooter}>
                    <j-button
                      variant="link"
                      onClick={() => createNewTodo(selectedProperty, columnId)}
                    >
                      Add card
                      <j-icon name="plus" size="md" slot="start"></j-icon>
                    </j-button>
                  </footer>
                </div>
              );
            })}
            {selectedClass && (
              <div>
                <j-button
                  variant="subtle"
                  onClick={() => setShowAddColumn(true)}
                >
                  <j-icon name="plus" size="sm" slot="start"></j-icon>
                </j-button>
              </div>
            )}
          </DragDropContext>
        </div>
      </div>
      {currentTaskId && (
        <j-modal
          open={currentTaskId ? true : false}
          onToggle={(e) =>
            setCurrentTaskId(e.currentTarget.open ? currentTaskId : null)
          }
        >
          <CardDetails
            agent={agent}
            perspective={perspective}
            id={currentTaskId}
            selectedClass={selectedClass}
            onDeleted={() => setCurrentTaskId(null)}
          ></CardDetails>
        </j-modal>
      )}
      <j-modal
        open={showAddColumn}
        onToggle={(e) => setShowAddColumn(e.currentTarget.open)}
      >
        <j-box px="800" py="600">
          <j-box pb="800">
            <j-text nomargin variant="heading">
              Add Column
            </j-text>
          </j-box>
          <j-flex direction="column" gap="400">
            <j-input
              placeholder="Name"
              size="lg"
              value={columnName}
              onInput={(e: Event) => {
                setColumnName(e.target.value);
              }}
            ></j-input>
            <j-button variant="primary" onClick={addColumn} full size="lg">
              Create
            </j-button>
          </j-flex>
        </j-box>
      </j-modal>
    </>
  );
}

function transformData(tasks: any[], property: string, options: NamedOption[]) {
  const defaultColumns = options.reduce(
    (acc, opt) => {
      return {
        ...acc,
        [opt.value]: {
          id: opt.value,
          title: opt.label,
          taskIds: [],
        },
      };
    },
    {
      Unkown: {
        id: "unknown",
        title: "unknown",
        taskIds: [],
      },
    }
  );

  return tasks.reduce(
    (acc, task) => {
      const status = property || "Unknown";

      return {
        ...acc,
        tasks: {
          ...acc.tasks,
          [task.id]: {
            id: task.id,
            title: task.title || task.name || task.id,
          },
        },
        columns: addTaskToColumn(acc.columns, task, property),
        columnOrder: acc.columnOrder,
      };
    },
    {
      tasks: {},
      columns: defaultColumns,
      columnOrder: options.map((c) => c.value),
    }
  );
}

async function getNamedOptions(perspective, className): Promise<NamedOptions> {
  return perspective
    .infer(
      `subject_class("${className}", Atom), property_named_option(Atom, Property, Value, Label).`
    )
    .then((res) => {
      if (res?.length) {
        return res.reduce((acc, option) => {
          return {
            ...acc,
            [option.Property]: [
              ...(acc[option.Property] || []),
              { label: option.Label, value: option.Value },
            ],
          };
        }, {});
      } else {
        return {};
      }
    });
}

function addTaskToColumn(columns, task, propertyName) {
  return Object.keys(columns).reduce((acc, key) => {
    const column = columns[key];
    return {
      ...acc,
      [key]: {
        ...column,
        taskIds:
          task[propertyName] === column.id
            ? [...column.taskIds, task.id]
            : column.taskIds,
      },
    };
  }, {});
}

function getClasses(perspective: PerspectiveProxy, source) {
  return perspective
    .infer(
      `subject_class(ClassName, Atom), property_named_option(Atom, Property, Value, Name).`
    )
    .then((result) => {
      if (Array.isArray(result)) {
        const uniqueClasses = [...new Set(result.map((c) => c.ClassName))];
        return uniqueClasses;
      } else {
        return [];
      }
    });
}
