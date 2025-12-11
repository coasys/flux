import { PerspectiveProxy, AgentClient } from '@coasys/ad4m';
import { Profile } from '@coasys/flux-types';
import { useState } from 'react';
import { TaskColumn } from '@coasys/flux-api';
import { Droppable, Draggable } from 'react-beautiful-dnd';
import styles from './Column.module.scss';
import TaskCard from '../TaskCard';
import TaskSettings from '../TaskSettings';
import { ColumnWithTasks } from '../Board/Board';

type ColumnProps = {
  perspective: PerspectiveProxy;
  channelId: string;
  agent: AgentClient;
  agentProfiles: Profile[];
  columns: TaskColumn[];
  column: ColumnWithTasks;
  updating: boolean;
  index: number;
  deleteColumn: () => void;
};

export default function Column({
  perspective,
  channelId,
  agent,
  agentProfiles,
  columns,
  column,
  updating,
  index,
  deleteColumn,
}: ColumnProps) {
  const [showNewTaskSettings, setShowNewTaskSettings] = useState(false);

  return (
    <Draggable draggableId={column.baseExpression} index={index} isDragDisabled={updating}>
      {(provided) => (
        <div ref={provided.innerRef} {...provided.draggableProps} className={styles.column}>
          <div className={styles.columnHeader} {...provided.dragHandleProps}>
            <j-text nomargin size="600">
              {column.columnName}
            </j-text>

            <j-button variant="link" onClick={deleteColumn} disabled={updating}>
              <j-icon name="x" color="ui-400" />
            </j-button>
          </div>

          <Droppable droppableId={column.baseExpression}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`${styles.tasks} ${snapshot.isDraggingOver ? styles.isDraggingOver : ''}`}
              >
                {column.tasks.map((task, index) => (
                  <TaskCard
                    key={task.baseExpression}
                    perspective={perspective}
                    channelId={channelId}
                    agent={agent}
                    columns={columns}
                    agentProfiles={agentProfiles}
                    column={column}
                    task={task}
                    index={index}
                    updating={updating}
                  />
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>

          <div className={styles.columnFooter}>
            <j-button variant="link" onClick={() => setShowNewTaskSettings(true)}>
              Add task
              <j-icon name="plus" slot="start" />
            </j-button>
          </div>

          {showNewTaskSettings && (
            <TaskSettings
              perspective={perspective}
              channelId={channelId}
              agent={agent}
              agentProfiles={agentProfiles}
              columns={columns}
              column={column}
              close={() => setShowNewTaskSettings(false)}
            />
          )}
        </div>
      )}
    </Draggable>
  );
}
