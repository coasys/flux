import { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import styles from "./Board.module.css";
import Todo from "../models/Todo";
import { useEntries } from "@fluxapp/react-web";
import { useEffect, useMemo } from "preact/hooks";
import { PerspectiveProxy } from "@perspect3vism/ad4m";

type BoardProps = {
  perspective: PerspectiveProxy;
  source: string;
};

export default function Board({ perspective, source }: BoardProps) {
  const { entries, model } = useEntries({
    perspective,
    source,
    model: Todo,
  });

  const [todos, setTodos] = useState([]);

  useEffect(() => {
    setTodos(entries);
  }, entries);

  const data = useMemo(() => {
    return transformData(todos);
  }, [todos]);

  function createNewTodo() {
    model.create({ title: "New todo" });
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
    setTodos(todos.map((t) => (t.id === draggableId ? { ...t, status } : t)));
    model.update(draggableId, { status });
  };

  return (
    <div className={styles.board}>
      <div className={styles.columns}>
        <DragDropContext onDragEnd={onDragEnd}>
          {data.columnOrder.map((columnId) => {
            const column = data.columns[columnId];
            const tasks = column.taskIds.map((taskId) => data.tasks[taskId]);

            return (
              <div key={column.id} className={styles.column}>
                <j-text nomargin variant="heading-sm">
                  {column.title}
                </j-text>
                <Droppable droppableId={column.id}>
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
                              <j-text>{task.content}</j-text>
                              <j-avatar size="xs" hash="123"></j-avatar>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
                <j-button variant="link" onClick={createNewTodo}>
                  Add card
                  <j-icon name="plus" size="sm" slot="start"></j-icon>
                </j-button>
              </div>
            );
          })}
        </DragDropContext>
      </div>
    </div>
  );
}

function transformData(todos: Todo[]) {
  return todos.reduce(
    (acc, todo) => {
      const status = todo.status || "Unknown";

      return {
        ...acc,
        tasks: {
          ...acc.tasks,
          [todo.id]: { id: todo.id, content: todo.title },
        },
        columns: {
          ...acc.columns,
          [status]: {
            id: status,
            title: status,
            taskIds: [...(acc.columns[status]?.taskIds || []), todo.id],
          },
        },
        columnOrder: acc.columnOrder.includes(status)
          ? acc.columnOrder
          : [...acc.columnOrder, status].sort(),
      };
    },
    {
      tasks: {},
      columns: {
        todo: {
          id: "todo",
          title: "todo",
          taskIds: [],
        },
        doing: {
          id: "doing",
          title: "doing",
          taskIds: [],
        },
        done: {
          id: "done",
          title: "done",
          taskIds: [],
        },
      },
      columnOrder: ["todo", "doing", "done"],
    }
  );
}
