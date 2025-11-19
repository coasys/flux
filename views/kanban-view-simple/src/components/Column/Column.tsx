import { PerspectiveProxy, AgentClient } from '@coasys/ad4m';
import { useModel } from '@coasys/ad4m-react-hooks';
import { Profile } from '@coasys/flux-types';
import { useEffect, useState, Fragment } from 'react';
import { Task, TaskColumn } from '@coasys/flux-api';
import { Droppable } from 'react-beautiful-dnd';
import styles from './Column.module.scss';
import TaskCard from '../TaskCard';
import TaskSettings from '../TaskSettings';

type ColumnProps = {
  perspective: PerspectiveProxy;
  source: string;
  agent: AgentClient;
  agentProfiles: Partial<Profile>[]; // TODO: remove Partial
  columns: TaskColumn[];
  column: TaskColumn;
};

export default function Column({ perspective, source, agent, agentProfiles, columns, column }: ColumnProps) {
  const [showNewTaskSettings, setShowNewTaskSettings] = useState(false);

  const { entries: tasks } = useModel({ perspective, model: Task, query: { source: column.baseExpression } });

  useEffect(() => {
    console.log('Tasks in column', column.columnName, tasks);
  }, [tasks, column.columnName]);

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
              {tasks.map((task, index) => (
                <TaskCard
                  perspective={perspective}
                  source={source}
                  agent={agent}
                  columns={columns}
                  agentProfiles={agentProfiles}
                  column={column}
                  task={task}
                  index={index}
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
