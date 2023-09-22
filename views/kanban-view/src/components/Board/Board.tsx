import { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import styles from "./Board.module.css";
import { useEntries } from "@fluxapp/react-web";
import { useCallback, useEffect } from "preact/hooks";
import { LinkQuery, PerspectiveProxy } from "@perspect3vism/ad4m";
import { generateKeyBetween } from "fractional-indexing";
import CardDetails from "../CardDetails";
import { AgentClient } from "@perspect3vism/ad4m/lib/src/agent/AgentClient";
import { List } from "@fluxapp/api";
// @ts-ignore
import taskSDNA from "./Task.pl?raw";
import Column from "../Column/Column";

type BoardProps = {
  perspective: PerspectiveProxy;
  source: string;
  agent: AgentClient;
};

export default function Board({ perspective, source, agent }: BoardProps) {
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [columnName, setColumnName] = useState("");
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("Task");
  const [optimisticColumns, setOptimisticColumns] = useState([]);

  const { entries: columns, model: columnModel } = useEntries({
    perspective,
    source,
    model: List,
  });

  const orderedColumns = optimisticColumns.slice().sort((a, b) => {
    if (a.order < b.order) {
      return -1;
    }
    if (a.order > b.order) {
      return 1;
    }
    return 0;
  });

  useEffect(() => {
    setOptimisticColumns(columns);
  }, [JSON.stringify(columns), perspective.uuid, source, selectedClass]);

  useEffect(() => {
    perspective.infer(`subject_class("Task", Atom)`).then((hasTask) => {
      if (!hasTask) {
        perspective
          .addSdna(taskSDNA)
          .then(() => getClasses(perspective, source).then(setClasses));
      }
    });
  }, [perspective.uuid]);

  const onDragEnd = useCallback(
    async (result) => {
      const { destination, source, draggableId, type } = result;

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

      if (type === "COLUMN") {
        const before = orderedColumns[destination.index - 1]?.order || null;
        const after = orderedColumns[destination.index + 1]?.order || null;

        try {
          let newOrder = await generateKeyBetween(before, after);

          setOptimisticColumns((oldState) => {
            return oldState.map((c) =>
              c.id === draggableId ? { ...c, order: newOrder } : c
            );
          });

          await columnModel.update(draggableId, { order: newOrder });
        } catch (e) {
          console.log("Couldn't update Column position");
        }
      }

      if (type === "TASK") {
        const listId = destination.droppableId;

        const existing = await perspective.get(
          new LinkQuery({ predicate: "rdf://has_child", target: draggableId })
        );

        setOptimisticColumns((oldState) => {
          return oldState.map((c) => {
            const isNewColumn = c.id === listId;
            const filteredChildren = c.children.filter(
              (c) => c.id !== draggableId
            );

            if (isNewColumn) {
              return { ...c, children: [...filteredChildren, draggableId] };
            } else {
              return { ...c, children: filteredChildren };
            }
          });
        });

        await perspective.removeLinks(existing);

        await perspective.add({
          source: listId,
          predicate: "rdf://has_child",
          target: draggableId,
        });
      }
    },
    [source, perspective.uuid, JSON.stringify(orderedColumns)]
  );

  const addColumn = useCallback(async () => {
    let order = generateKeyBetween(null, null);

    if (orderedColumns.length > 0) {
      try {
        order = await generateKeyBetween(
          orderedColumns[orderedColumns.length - 1].order,
          null
        );
      } catch (e) {
        console.log(e);
      }
    }

    columnModel.create({ name: columnName, order });
  }, [perspective.uuid, source, orderedColumns]);

  console.log(`recieved updates`, columns);

  return (
    <>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable
          ignoreContainerClipping={true}
          direction="horizontal"
          droppableId="board"
          type="COLUMN"
        >
          {(provided, snapshot) => (
            <div
              className={styles.board}
              ref={provided.innerRef}
              {...provided.droppableProps}
            >
              <div className={styles.columns}>
                {orderedColumns.map((column, index) => {
                  return (
                    <Draggable
                      key={column.id}
                      draggableId={column.id}
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                        >
                          <Column
                            taskIds={column.children}
                            perspective={perspective}
                            id={column.id}
                            selectedClass={selectedClass}
                            setCurrentTaskId={setCurrentTaskId}
                          ></Column>
                        </div>
                      )}
                    </Draggable>
                  );
                })}
              </div>
              {provided.placeholder}
            </div>
          )}
        </Droppable>

        <div>
          <j-button variant="subtle" onClick={() => setShowAddColumn(true)}>
            <j-icon name="plus" size="sm" slot="start"></j-icon>
          </j-button>
        </div>
      </DragDropContext>
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

function getClasses(perspective: PerspectiveProxy, source) {
  return perspective.infer(`subject_class(ClassName, _)`).then((result) => {
    if (Array.isArray(result)) {
      const uniqueClasses = [...new Set(result.map((c) => c.ClassName))];
      return uniqueClasses;
    } else {
      return [];
    }
  });
}
