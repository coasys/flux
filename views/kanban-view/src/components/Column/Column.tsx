import { useEntries, useEntry } from "@fluxapp/react-web";
import styles from "./Column.module.css";
import { List } from "@fluxapp/api";
import { Droppable, Draggable } from "react-beautiful-dnd";
import Card from "../Card";

export default function Column({
  id,
  taskIds,
  perspective,
  selectedClass,
  setCurrentTaskId,
}) {
  const { entry: column } = useEntry({ perspective, id, model: List });
  const { entries: tasks, model: taskModel } = useEntries({
    perspective,
    source: id,
    model: selectedClass,
  });

  if (!column) return null;

  const optimisticTasks = taskIds.map((id) => {
    const existingTask = tasks.find((t) => t.id === id);
    if (existingTask) return existingTask;
    else return { id };
  });

  return (
    <div className={styles.column}>
      <header className={styles.columnHeader}>
        <j-text nomargin size="500" weight="600" color="black">
          {column.name}
        </j-text>
      </header>
      <div className={styles.columnContent}>
        <Droppable type="TASK" droppableId={column.id}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`${styles.tasks} ${
                snapshot.isDraggingOver ? styles.isDraggingOver : ""
              }`}
            >
              {optimisticTasks.map((task, index) => (
                <Draggable key={task.id} draggableId={task.id} index={index}>
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
        <j-button variant="link" onClick={() => taskModel.create({})}>
          Add {selectedClass}
          <j-icon name="plus" size="md" slot="start"></j-icon>
        </j-button>
      </footer>
    </div>
  );
}
