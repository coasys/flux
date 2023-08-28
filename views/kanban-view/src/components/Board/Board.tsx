import { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import styles from "./Board.module.css";
import Todo from "../models/Todo";
import { useEntries, useEntry } from "@fluxapp/react-web";
import { useEffect, useMemo } from "preact/hooks";
import { PerspectiveProxy } from "@perspect3vism/ad4m";
import Card from "../Card";
import CardDetails from "../CardDetails";
import { AgentClient } from "@perspect3vism/ad4m/lib/src/agent/AgentClient";

type BoardProps = {
  perspective: PerspectiveProxy;
  source: string;
  agent: AgentClient;
};

type NamedOption = {
  value: string;
  name: string;
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
          .addSdna(
            `
              subject_class("Task", pvwrkd).
              constructor(pvwrkd, '[{action: "addLink", source: "this", predicate: "rdf://name", target: "literal://json:%7B%22author%22%3A%22did%3Akey%3AzQ3shWhAZydqDE1s5Ka3gJTDpjdYg1Ajw6PFywSP7QJD8x8ki%22%2C%22timestamp%22%3A%222023-07-06T16%3A25%3A41.597Z%22%2C%22data%22%3A%22New%20task%22%2C%22proof%22%3A%7B%22key%22%3A%22%23zQ3shWhAZydqDE1s5Ka3gJTDpjdYg1Ajw6PFywSP7QJD8x8ki%22%2C%22signature%22%3A%2281a4f1b56d73e3069cd0a35addc31bd418c2d15a336110de3c1c8639bcc01c857a888846e5cd0714f6a0457bcef609a7cd23ecb578dcf00a25f848951013de3d%22%2C%22valid%22%3Atrue%2C%22invalid%22%3Afalse%7D%7D"},{action: "addLink", source: "this", predicate: "rdf://status", target: "literal://json:%7B%22author%22%3A%22did%3Akey%3AzQ3shWhAZydqDE1s5Ka3gJTDpjdYg1Ajw6PFywSP7QJD8x8ki%22%2C%22timestamp%22%3A%222023-07-06T16%3A25%3A41.606Z%22%2C%22data%22%3A%22todo%22%2C%22proof%22%3A%7B%22key%22%3A%22%23zQ3shWhAZydqDE1s5Ka3gJTDpjdYg1Ajw6PFywSP7QJD8x8ki%22%2C%22signature%22%3A%226ca7bb8bc2db7d90b995902f6278974a879eeafe871885614933cc553f1afe935cc4e0221c7de7e7b2c46d1d6dbc4c752879a782e24cd134afaa63812297a05e%22%2C%22valid%22%3Atrue%2C%22invalid%22%3Afalse%7D%7D"}]').
              instance(pvwrkd, Base) :- triple(Base, "rdf://name", _),triple(Base, "rdf://status", _).
              
              property(pvwrkd, "name").
              property_resolve(pvwrkd, "name").
              property_resolve_language(pvwrkd, "name", "literal").
              property_getter(pvwrkd, Base, "name", Value) :- triple(Base, "rdf://name", Value).
              property_setter(pvwrkd, "name", '[{action: "setSingleTarget", source: "this", predicate: "rdf://name", target: "value"}]').
                  
              property(pvwrkd, "status").
              property_resolve(pvwrkd, "status").
              property_resolve_language(pvwrkd, "status", "literal").
              property_getter(pvwrkd, Base, "status", Value) :- triple(Base, "rdf://status", Value).
              property_setter(pvwrkd, "status", '[{action: "setSingleTarget", source: "this", predicate: "rdf://status", target: "value"}]').
              property_named_option(pvwrkd, "status", "todo", "todo").
              property_named_option(pvwrkd, "status", "doing", "doing").
              property_named_option(pvwrkd, "status", "done", "done").

              collection(pvwrkd, "assignees").
              collection_getter(pvwrkd, Base, "assignees", List) :- findall(C, triple(Base, "rdf://has_assignee", C), List).
              collection_adder(pvwrkd, "assigneess", '[{action: "addLink", source: "this", predicate: "rdf://has_assignee", target: "value"}]').
              collection_remover(pvwrkd, "assigneess", '[{action: "removeLink", source: "this", predicate: "rdf://has_assignee", target: "value"}]').
              collection_setter(pvwrkd, "assigneess", '[{action: "collectionSetter", source: "this", predicate: "rdf://has_assignee", target: "value"}]').
            `
          )
          .then(() => getClasses(perspective, source).then(setClasses));
      }
    });
  }, []);

  const { entries, model } = useEntries({
    perspective,
    source,
    model: selectedClass,
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
  }, [entries, perspective.uuid]);

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
  }, [tasks, selectedProperty, perspective.uuid, namedOptions]);

  function createNewTodo(propertyName, value) {
    model.create({ [propertyName]: value });
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

    model.update(draggableId, { [selectedProperty]: status });
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
                  <j-text nomargin size="500" weight="600" color="black">
                    {column.title}
                  </j-text>
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
                  <j-button
                    variant="link"
                    onClick={() => createNewTodo(selectedProperty, columnId)}
                  >
                    Add card
                    <j-icon name="plus" size="md" slot="start"></j-icon>
                  </j-button>
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
      <j-modal
        open={currentTaskId ? true : false}
        onToggle={(e) => setCurrentTaskId(e.target.open ? currentTaskId : null)}
      >
        <CardDetails
          agent={agent}
          perspective={perspective}
          id={currentTaskId}
          selectedClass={selectedClass}
          onDeleted={() => setCurrentTaskId(null)}
        ></CardDetails>
      </j-modal>
      <j-modal
        open={showAddColumn}
        onToggle={(e) => setShowAddColumn(e.target.open)}
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
        [opt.name]: {
          id: opt.value,
          title: opt.name,
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
      columnOrder: options.map((c) => c.name),
    }
  );
}

async function getNamedOptions(perspective, className): Promise<NamedOptions> {
  return perspective
    .infer(
      `subject_class("${className}", Atom), property_named_option(Atom, Property, Value, Name).`
    )
    .then((res) => {
      if (res?.length) {
        return res.reduce((acc, option) => {
          return {
            ...acc,
            [option.Property]: [
              ...(acc[option.Property] || []),
              { name: option.Name, value: option.Value },
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
