import { PerspectiveProxy, LinkQuery, AgentClient } from '@coasys/ad4m';
import { useModel } from '@coasys/ad4m-react-hooks';
import { Message } from '@coasys/flux-api';
import { Profile } from '@coasys/flux-types';
import { useState, useMemo } from 'react';
import styles from './TaskSettings.module.scss';
import { Task, TaskColumn } from '@coasys/flux-api';
import AvatarGroup from '../AvatarGroup';

type Props = {
  perspective: PerspectiveProxy;
  source: string;
  agent: AgentClient;
  agentProfiles: Profile[];
  columns: TaskColumn[];
  column: TaskColumn;
  task?: Task;
  close: () => void;
};

export default function TaskSettings({
  perspective,
  source,
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

  const { entries: comments } = useModel({
    perspective,
    model: Message,
    query: { source: task?.baseExpression },
  });

  const assignedProfiles = useMemo(() => {
    return agentProfiles.filter((p) => taskAssignees.includes(p.did));
  }, [taskAssignees, agentProfiles]);

  async function linkTaskToColumn(task: Task, columnName: string) {
    // Get the column by name
    const column = columns.find((col) => col.columnName === columnName);
    if (!column) throw new Error('Column not found');

    // Link the task to the column
    await perspective.addLinks([
      { source: column.baseExpression, predicate: 'ad4m://has_child', target: task.baseExpression },
    ]);

    // Store the task position in the column
    const updatedOrderedTaskIds = [...(JSON.parse(column.orderedTaskIds) || []), task.baseExpression];
    column.orderedTaskIds = JSON.stringify(updatedOrderedTaskIds);
    await column.update();
  }

  async function saveTask() {
    setSaving(true);

    if (task) {
      // Update task name if changed
      if (task.taskName !== taskName) {
        task.taskName = taskName;
        await task.update();
      }

      // Update column if changed
      if (column.columnName !== taskColumn) {
        // Unlink task from old column
        const oldLinks = await perspective.get(
          new LinkQuery({ source: column.baseExpression, predicate: 'ad4m://has_child', target: task.baseExpression }),
        );
        await perspective.removeLinks([oldLinks[0]]);

        // Link task to new column
        await linkTaskToColumn(task, taskColumn);
      }

      // Update assignees if changed
      const additions = taskAssignees.filter((a) => !task.assignees.includes(a));
      const removals = task.assignees.filter((a) => !taskAssignees.includes(a));

      // Add new assignees
      for (const assignee of additions) {
        await perspective.addLinks([
          { source: task.baseExpression, predicate: 'flux://task_assignee', target: assignee },
        ]);
      }

      // Remove old assignees
      for (const assignee of removals) {
        const oldLinks = await perspective.get(
          new LinkQuery({ source: task.baseExpression, predicate: 'flux://task_assignee', target: assignee }),
        );
        await perspective.removeLinks([oldLinks[0]]);
      }
    } else {
      // Create new task
      const newTask = new Task(perspective, undefined, source);
      newTask.taskName = taskName;
      await newTask.save();

      // Link task to column
      await linkTaskToColumn(newTask, taskColumn);
    }

    setSaving(false);
    close();
  }

  async function deleteTask() {
    setDeleting(true);
    await task.delete();
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
            <j-input value={taskName} onChange={(e) => setTaskName((e.target as HTMLTextAreaElement).value)} />
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
