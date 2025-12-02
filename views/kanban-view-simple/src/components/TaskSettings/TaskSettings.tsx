import { PerspectiveProxy, LinkQuery, AgentClient } from '@coasys/ad4m';
import { Profile } from '@coasys/flux-types';
import { useState, useMemo } from 'react';
import styles from './TaskSettings.module.scss';
import { Task, TaskColumn } from '@coasys/flux-api';
import AvatarGroup from '../AvatarGroup';
import { ColumnWithTasks } from '../Board/Board';

type Props = {
  perspective: PerspectiveProxy;
  channelId: string;
  agent: AgentClient;
  agentProfiles: Profile[];
  columns: TaskColumn[];
  column: ColumnWithTasks;
  task?: Task;
  close: () => void;
};

export default function TaskSettings({
  perspective,
  channelId,
  agent,
  agentProfiles,
  columns,
  column,
  task,
  close,
}: Props) {
  const [taskName, setTaskName] = useState(task?.taskName || '');
  const [taskColumn, setTaskColumn] = useState(column.columnName);
  const [taskAssignees, setTaskAssignees] = useState<string[]>(task?.assignees || []);
  const [assigneesMenuOpen, setAssigneesMenuOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const assignedProfiles = useMemo(() => {
    return agentProfiles.filter((p) => taskAssignees.includes(p.did));
  }, [taskAssignees, agentProfiles]);

  async function saveTask() {
    setSaving(true);

    if (task) {
      // Update existing task
      const batchId = await perspective.createBatch();
      const taskModel = new Task(perspective, task.baseExpression);
      await taskModel.get();

      // Update task name if changed
      if (task.taskName !== taskName) {
        taskModel.taskName = taskName;
        await taskModel.update(batchId);
      }

      // Update column if changed
      if (column.columnName !== taskColumn) {
        const source = columns.find((col) => col.columnName === column.columnName);
        const destination = columns.find((col) => col.columnName === taskColumn);

        // Update orderedTaskIds in source column
        const sourceOrderedTaskIds = JSON.parse(source.orderedTaskIds).filter((id) => id !== task.baseExpression);
        source.orderedTaskIds = JSON.stringify(sourceOrderedTaskIds);
        await source.update(batchId);

        // Update orderedTaskIds in destination column
        const destinationOrderedTaskIds = [...(JSON.parse(destination.orderedTaskIds) || []), task.baseExpression];
        destination.orderedTaskIds = JSON.stringify(destinationOrderedTaskIds);
        await destination.update(batchId);
      }

      // Update assignees if changed
      const additions = taskAssignees.filter((a) => !task.assignees.includes(a));
      const removals = task.assignees.filter((a) => !taskAssignees.includes(a));

      for (const assignee of additions) {
        const newLink = { source: task.baseExpression, predicate: 'flux://task_assignee', target: assignee };
        await perspective.addLinks([newLink], undefined, batchId);
      }

      for (const assignee of removals) {
        const oldLinks = await perspective.get(
          new LinkQuery({ source: task.baseExpression, predicate: 'flux://task_assignee', target: assignee }),
        );
        await perspective.removeLinks([oldLinks[0]], batchId);
      }

      // Commit batch updates
      await perspective.commitBatch(batchId);
    } else {
      // Create new task
      const batchId = await perspective.createBatch();
      const newTaskModel = new Task(perspective, undefined, channelId);
      newTaskModel.taskName = taskName;
      await newTaskModel.save(batchId);

      // Link the task to the perspective
      const newLink = { source: channelId, predicate: 'ad4m://has_child', target: newTaskModel.baseExpression };
      await perspective.addLinks([newLink], undefined, batchId);

      // Store the task position in the column
      const columnModel = columns.find((col) => col.columnName === taskColumn);
      const newOrderedTaskIds = [...(JSON.parse(columnModel.orderedTaskIds) || []), newTaskModel.baseExpression];
      columnModel.orderedTaskIds = JSON.stringify(newOrderedTaskIds);
      await columnModel.update(batchId);

      // Commit batch updates
      await perspective.commitBatch(batchId);
    }

    setSaving(false);
    close();
  }

  async function deleteTask() {
    setDeleting(true);

    const batchId = await perspective.createBatch();

    // Delete task model
    const taskModel = new Task(perspective, task.baseExpression);
    await taskModel.delete(batchId);

    // Delete task link to perspective
    const linkQuery = new LinkQuery({ source: channelId, predicate: 'ad4m://has_child', target: task.baseExpression });
    const oldLinks = await perspective.get(linkQuery);
    await perspective.removeLinks(oldLinks, batchId);

    // Update orderedTaskIds in column
    const columnModel = columns.find((col) => col.baseExpression === column.baseExpression);
    const newOrderedTaskIds = JSON.parse(column.orderedTaskIds).filter((id: string) => id !== task.baseExpression);
    columnModel.orderedTaskIds = JSON.stringify(newOrderedTaskIds);
    await columnModel.update(batchId);

    // Commit batch updates
    await perspective.commitBatch(batchId);

    setDeleting(false);
    close();
  }

  function closeMenu(menuId: string) {
    const menu = document.getElementById(menuId);
    const items = menu?.shadowRoot?.querySelector('details');
    if (items) items.open = false;
  }

  return (
    // @ts-ignore
    <j-modal open onToggle={(e) => !e.target.open && close()}>
      <j-box p="600">
        <j-flex direction="column" gap="600">
          {/* Name */}
          <j-flex a="center" gap="400">
            <j-text nomargin>Name</j-text>
            <j-input value={taskName} onInput={(e) => setTaskName((e.target as HTMLTextAreaElement).value)} />
          </j-flex>

          {/* Status */}
          <j-flex a="center" gap="400">
            <j-text nomargin>Status</j-text>
            <j-menu style={{ height: '42px', zIndex: 3 }}>
              <j-menu-group collapsible title={taskColumn} id="task-settings-menu">
                {columns.map((column) => (
                  <j-menu-item
                    key={column.baseExpression}
                    selected={task?.baseExpression === column.baseExpression}
                    onClick={() => {
                      setTaskColumn(column.columnName);
                      closeMenu('task-settings-menu');
                    }}
                  >
                    {column.columnName}
                  </j-menu-item>
                ))}
              </j-menu-group>
            </j-menu>
          </j-flex>

          {/* Assignees */}
          <j-flex a="center" gap="400">
            <j-text nomargin>Assignees</j-text>
            {assignedProfiles.length > 0 && <AvatarGroup avatars={assignedProfiles} />}

            <j-button onClick={() => setAssigneesMenuOpen(!assigneesMenuOpen)} variant="ghost" size="sm">
              <j-icon name="pencil-square" size="xs" />
            </j-button>

            {assigneesMenuOpen && (
              <j-menu className={styles.menu}>
                {agentProfiles.map((profile) => (
                  <j-menu-item key={profile.did}>
                    <j-checkbox
                      full
                      checked={taskAssignees.some((a) => a === profile.did)}
                      onChange={(e: any) => {
                        const checked = e.target.checked;
                        if (checked) setTaskAssignees([...taskAssignees, profile.did]);
                        else setTaskAssignees(taskAssignees.filter((a) => a !== profile.did));
                        setAssigneesMenuOpen(false);
                      }}
                      size="sm"
                      slot="start"
                    >
                      <j-flex a="center" gap="400">
                        <j-avatar size="xs" src={profile.profileThumbnailPicture} hash={profile.did} />
                        <j-text nomargin size="400" color="ui-800">
                          {profile.username}
                        </j-text>
                      </j-flex>
                    </j-checkbox>
                  </j-menu-item>
                ))}
              </j-menu>
            )}
          </j-flex>

          {/* Buttons */}
          <j-flex a="center" gap="400">
            <j-button variant="primary" disabled={!taskName || saving} loading={saving} onClick={saveTask}>
              Save
            </j-button>

            {task && (
              <j-button disabled={deleting} loading={deleting} onClick={deleteTask}>
                Delete
              </j-button>
            )}
          </j-flex>
        </j-flex>
      </j-box>

      {task && (
        <div className={styles.commentSection}>
          {/* @ts-ignore */}
          <comment-section perspective={perspective} source={task.baseExpression} agent={agent} />
        </div>
      )}
    </j-modal>
  );
}
