import { PerspectiveProxy, LinkQuery } from '@coasys/ad4m';
import { useModel } from '@coasys/ad4m-react-hooks';
import { AgentClient } from '@coasys/ad4m/lib/src/agent/AgentClient';
import { Profile } from '@coasys/flux-types';
import { useState, useEffect, Fragment, useMemo, useRef } from 'react';
import { Task, TaskColumn } from '@coasys/flux-api';
import { DragDropContext, DropResult } from 'react-beautiful-dnd';
import styles from './Board.module.scss';
import Column from '../Column';

type BoardProps = {
  perspective: PerspectiveProxy;
  source: string;
  agent: AgentClient;
  getProfile: (did: string) => Promise<Profile>;
};

export type ColumnWithTasks = TaskColumn & { tasks: Task[] };

export default function Board({ perspective, source, agent, getProfile }: BoardProps) {
  const [showNewColumnModal, setShowNewColumnModal] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnLoading, setNewColumnLoading] = useState(false);
  const [agentProfiles, setAgentProfiles] = useState<Profile[]>([]);
  const [columnsWithTasks, setColumnsWithTasks] = useState<ColumnWithTasks[]>([]);

  const [updating, setUpdating] = useState(false);
  const updatingRef = useRef(false);

  const { entries: columns } = useModel({ perspective, model: TaskColumn, query: { source } });
  const { entries: tasks } = useModel({ perspective, model: Task, query: { source } });

  async function getProfiles() {
    const others = await perspective.getNeighbourhoodProxy().otherAgents();
    const me = await agent.me();
    const agentDids = [me.did, ...others];
    // Set minimal profiles while loading full ones
    setAgentProfiles(agentDids.map((did) => ({ did }) as Profile));
    const profiles = await Promise.all(agentDids.map(getProfile));
    setAgentProfiles(profiles);
  }

  async function addColumn() {
    setNewColumnLoading(true);

    // Create and save the new column
    const newColumn = new TaskColumn(perspective, undefined, source);
    newColumn.columnName = newColumnName;
    newColumn.orderedTaskIds = JSON.stringify([]);
    await newColumn.save();

    // Reset state and hide the modal
    setNewColumnName('');
    setNewColumnLoading(false);
    setShowNewColumnModal(false);
  }

  async function updateTaskPosition(dropResult: DropResult) {
    const { destination, source, draggableId } = dropResult;

    // If there is no column destination, do nothing
    if (!destination) return;

    // If the task is dropped in its original position, do not do anything
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    // Set updating state to block concurrent updates
    updatingRef.current = true;
    setUpdating(true);

    try {
      // If the task is dropped in a different column
      if (destination.droppableId !== source.droppableId) {
        // Optimistically update the UI
        const newColumns = [...columnsWithTasks];
        const sourceColumn = newColumns.find((col) => col.baseExpression === source.droppableId);
        const destinationColumn = newColumns.find((col) => col.baseExpression === destination.droppableId);

        // Remove task from source column and add to destination column
        const [movedTask] = sourceColumn.tasks.splice(source.index, 1);
        destinationColumn.tasks.splice(destination.index, 0, movedTask);

        // Update orderedTaskIds in source column
        const sourceOrderedTaskIds = JSON.parse(sourceColumn.orderedTaskIds);
        sourceOrderedTaskIds.splice(source.index, 1);
        sourceColumn.orderedTaskIds = JSON.stringify(sourceOrderedTaskIds);

        // Update orderedTaskIds in destination column
        const destOrderedTaskIds = JSON.parse(destinationColumn.orderedTaskIds);
        destOrderedTaskIds.splice(destination.index, 0, draggableId);
        destinationColumn.orderedTaskIds = JSON.stringify(destOrderedTaskIds);

        setColumnsWithTasks(newColumns);

        // Update the perspective
        const batchId = await perspective.createBatch();

        // Update orderedTaskIds in source column
        const sourceColumnModel = columns.find((col) => col.baseExpression === source.droppableId);
        sourceColumnModel.orderedTaskIds = sourceColumn.orderedTaskIds;
        await sourceColumnModel.update(batchId);

        // Update orderedTaskIds in destination column
        const destinationColumnModel = columns.find((col) => col.baseExpression === destination.droppableId);
        destinationColumnModel.orderedTaskIds = destinationColumn.orderedTaskIds;
        await destinationColumnModel.update(batchId);

        // Apply batch updates
        await perspective.commitBatch(batchId);
      } else {
        // If the task is reordered within the same column
        const column = columnsWithTasks.find((col) => col.baseExpression === source.droppableId);

        // Create the new orderedTaskIds
        const newOrderedTaskIds = JSON.parse(column.orderedTaskIds);
        newOrderedTaskIds.splice(source.index, 1);
        newOrderedTaskIds.splice(destination.index, 0, draggableId);

        // Optimistically update the UI
        const newColumns = [...columnsWithTasks];
        const newColumn = newColumns.find((col) => col.baseExpression === column.baseExpression);
        const [movedTask] = newColumn.tasks.splice(source.index, 1);
        newColumn.tasks.splice(destination.index, 0, movedTask);
        newColumn.orderedTaskIds = JSON.stringify(newOrderedTaskIds);
        setColumnsWithTasks(newColumns);

        // Update the perspective
        const columnModel = columns.find((col) => col.baseExpression === column.baseExpression);
        columnModel.orderedTaskIds = JSON.stringify(newOrderedTaskIds);
        await columnModel.update();
      }
    } finally {
      updatingRef.current = false;
      setUpdating(false);
    }
  }

  async function getColumnsWithTasks(newColumns: TaskColumn[]) {
    const newColumnsWithTasks = (await Promise.all(
      newColumns.map(async (column) => {
        // Get tasks and order them by the columns orderedTaskIds property
        const taskIds = column.orderedTaskIds ? JSON.parse(column.orderedTaskIds) : [];
        const tasks = await Task.findAll(perspective, { where: { base: taskIds } });
        const orderedTasks = [];
        for (const taskId of taskIds) {
          const task = tasks.find((t) => t.baseExpression === taskId);
          if (task) orderedTasks.push(task);
        }

        // Get the timestamp from the link connecting the column to the perspective for column sorting
        const linkQuery = new LinkQuery({ source, predicate: 'ad4m://has_child', target: column.baseExpression });
        const links = await perspective.get(linkQuery);
        column.timestamp = links[0]?.timestamp || '';
        return { ...column, baseExpression: column.baseExpression, tasks: orderedTasks };
      }),
    )) as ColumnWithTasks[];

    // Sort columns by timestamp ascending
    newColumnsWithTasks.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    setColumnsWithTasks(newColumnsWithTasks);
  }

  // Fetch agent profiles on component mount
  useEffect(() => {
    if (getProfile) getProfiles();
  }, [perspective.uuid, getProfile]);

  // Update columns with tasks when columns or tasks change, unless an update is ongoing
  useEffect(() => {
    if (!updatingRef.current) getColumnsWithTasks(columns);
  }, [columns, tasks]);

  return (
    <>
      <div className={styles.board}>
        {/* Columns */}
        <DragDropContext onDragEnd={updateTaskPosition}>
          {columnsWithTasks.map((column) => (
            <Column
              key={column.baseExpression}
              perspective={perspective}
              source={source}
              agent={agent}
              agentProfiles={agentProfiles}
              columns={columns}
              column={column}
              updating={updating}
            />
          ))}
        </DragDropContext>

        {updating && <j-spinner />}

        {/* Create new column button */}
        <j-button variant="subtle" onClick={() => setShowNewColumnModal(true)}>
          <j-icon name="plus" size="sm" slot="start" />
        </j-button>
      </div>

      {/* Create new column modal */}
      {/* @ts-ignore */}
      <j-modal open={showNewColumnModal} onToggle={(e) => setShowNewColumnModal(e.currentTarget.open)}>
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
              value={newColumnName}
              onInput={(e: any) => setNewColumnName(e.target.value)}
            />

            <j-button
              variant="primary"
              disabled={!newColumnName || newColumnLoading}
              loading={newColumnLoading}
              onClick={addColumn}
              full
              size="lg"
            >
              Create
            </j-button>
          </j-flex>
        </j-box>
      </j-modal>
    </>
  );
}
