import { PerspectiveProxy, AgentClient } from '@coasys/ad4m';
import { Profile } from '@coasys/flux-types';
import { useState, Fragment } from 'react';
import { TaskColumn } from '@coasys/flux-api';
import { Droppable } from 'react-beautiful-dnd';
import styles from './Column.module.scss';
import TaskCard from '../TaskCard';
import TaskSettings from '../TaskSettings';
import { ColumnWithTasks } from '../Board/Board';

type ColumnProps = {
  perspective: PerspectiveProxy;
  source: string;
  agent: AgentClient;
  agentProfiles: Profile[];
  columns: TaskColumn[];
  column: ColumnWithTasks;
  updating: boolean;
};

export default function Column({ perspective, source, agent, agentProfiles, columns, column, updating }: ColumnProps) {
  const [showNewTaskSettings, setShowNewTaskSettings] = useState(false);

  return (
    <>
      <div className={styles.column}>
        <div className={styles.columnHeader}>
          <j-text nomargin size="600">
            {column.columnName}
          </j-text>
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
                  source={source}
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
      </div>

      {/* Create new task modal */}
      {showNewTaskSettings && (
        <TaskSettings
          perspective={perspective}
          source={source}
          agent={agent}
          agentProfiles={agentProfiles}
          columns={columns}
          column={column}
          close={() => setShowNewTaskSettings(false)}
        />
      )}
    </>
  );
}
