import { PerspectiveProxy, AgentClient } from '@coasys/ad4m';
import { useModel } from '@coasys/ad4m-react-hooks';
import { Message } from '@coasys/flux-api';
import { Profile } from '@coasys/flux-types';
import { useState, Fragment, useMemo } from 'react';
import styles from './TaskCard.module.scss';
import { Task, TaskColumn } from '@coasys/flux-api';
import { Draggable } from 'react-beautiful-dnd';
import TaskSettings from '../TaskSettings';
import AvatarGroup from '../AvatarGroup';
import { ColumnWithTasks } from '../Board/Board';

type Props = {
  perspective: PerspectiveProxy;
  channelId: string;
  agent: AgentClient;
  agentProfiles: Profile[];
  columns: TaskColumn[];
  column: ColumnWithTasks;
  task: Task;
  index: number;
  updating: boolean;
};

export default function TaskCard({
  perspective,
  channelId,
  agent,
  agentProfiles,
  columns,
  column,
  task,
  index,
  updating,
}: Props) {
  const [showTaskSettings, setShowTaskSettings] = useState(false);

  const { entries: comments } = useModel({ perspective, model: Message, query: { source: task.baseExpression } });

  const assignedProfiles = useMemo(() => {
    return agentProfiles.filter((p) => task.assignees.includes(p.did));
  }, [task.assignees, agentProfiles]);

  return (
    <>
      <div className={styles.wrapper} onClick={() => !updating && setShowTaskSettings(true)}>
        <Draggable key={task.baseExpression} draggableId={task.baseExpression} index={index} isDragDisabled={updating}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.draggableProps}
              {...provided.dragHandleProps}
              className={`${styles.task} ${snapshot.isDragging ? styles.isDragging : ''}`}
            >
              <j-flex a="center" j="between">
                <j-text size="500" color="ui-800" nomargin>
                  {task.taskName}
                </j-text>
              </j-flex>

              <j-flex a="center" j="between">
                <j-flex a="center" gap="200">
                  <j-icon color="ui-400" size="xs" name="chat-square"></j-icon>
                  <j-text nomargin size="400" color="ui-400">
                    {comments.length}
                  </j-text>
                </j-flex>

                {assignedProfiles.length > 0 && <AvatarGroup avatars={assignedProfiles} />}
              </j-flex>
            </div>
          )}
        </Draggable>
      </div>

      {/* Edit task modal */}
      {showTaskSettings && (
        <TaskSettings
          perspective={perspective}
          channelId={channelId}
          agent={agent}
          agentProfiles={agentProfiles}
          columns={columns}
          column={column}
          task={task}
          close={() => setShowTaskSettings(false)}
        />
      )}
    </>
  );
}
