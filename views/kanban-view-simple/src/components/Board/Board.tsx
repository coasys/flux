import { PerspectiveProxy, LinkQuery } from '@coasys/ad4m';
import { useModel } from '@coasys/ad4m-react-hooks';
import { AgentClient } from '@coasys/ad4m/lib/src/agent/AgentClient';
import { Profile } from '@coasys/flux-types';
import { useState, useEffect, Fragment, useRef } from 'react';
import { Task, TaskBoard, TaskColumn } from '@coasys/flux-api';
import { DragDropContext, DropResult, Droppable } from 'react-beautiful-dnd';
import styles from './Board.module.scss';
import Column from '../Column';

type BoardProps = {
  perspective: PerspectiveProxy;
  channelId: string;
  agent: AgentClient;
  getProfile: (did: string) => Promise<Profile>;
};

export type ColumnWithTasks = TaskColumn & { tasks: Task[] };

export default function Board({ perspective, channelId, agent, getProfile }: BoardProps) {
  const [board, setBoard] = useState<TaskBoard | null>(null);
  const [showNewColumnModal, setShowNewColumnModal] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnLoading, setNewColumnLoading] = useState(false);
  const [agentProfiles, setAgentProfiles] = useState<Profile[]>([]);
  const [columnsWithTasks, setColumnsWithTasks] = useState<ColumnWithTasks[]>([]);

  const [updating, setUpdating] = useState(false);
  const updatingRef = useRef(false);

  const { entries: columns } = useModel({ perspective, model: TaskColumn, query: { source: channelId } });
  const { entries: tasks } = useModel({ perspective, model: Task, query: { source: channelId } });

  async function initialiseBoard() {
    const board = (await TaskBoard.findAll(perspective, { source: channelId }))[0];
    if (board) setBoard(board);
    else {
      // Create the default columns
      const defaultColumns = await Promise.all(
        ['todo', 'doing', 'done'].map(async (name) => {
          const column = new TaskColumn(perspective, undefined, channelId);
          column.columnName = name;
          column.orderedTaskIds = JSON.stringify([]);
          await column.save();
          return column;
        }),
      );

      // Create the board with the ordered column ids
      const newBoard = new TaskBoard(perspective, undefined, channelId);
      newBoard.boardName = 'Kanban Board';
      newBoard.orderedColumnIds = JSON.stringify(defaultColumns.map((col) => col.baseExpression));
      await newBoard.save();

      setBoard(newBoard);
    }
  }

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
    // Set updating state to block concurrent updates
    updatingRef.current = true;
    setUpdating(true);
    setNewColumnLoading(true);

    // Create and save the new column
    const newColumn = new TaskColumn(perspective, undefined, channelId);
    newColumn.columnName = newColumnName;
    newColumn.orderedTaskIds = JSON.stringify([]);
    await newColumn.save();

    // Update the board's orderedColumnIds
    const currentBoard = (await TaskBoard.findAll(perspective, { source: channelId }))[0];
    const newOrderedColumnIds = [...JSON.parse(currentBoard.orderedColumnIds), newColumn.baseExpression];
    currentBoard.orderedColumnIds = JSON.stringify(newOrderedColumnIds);
    await currentBoard.update();

    // Update the UI
    await getColumnsWithTasks(columns, newOrderedColumnIds);
    setBoard(currentBoard);

    // Reset state
    updatingRef.current = false;
    setUpdating(false);
    setNewColumnName('');
    setNewColumnLoading(false);
    setShowNewColumnModal(false);
  }

  async function deleteColumn(columnId: string) {
    // Set updating state to block concurrent updates
    updatingRef.current = true;
    setUpdating(true);

    // Generate the new orderedColumnIds
    const currentBoard = (await TaskBoard.findAll(perspective, { source: channelId }))[0];
    const orderedColumnIds = JSON.parse(currentBoard.orderedColumnIds);
    const newOrderedColumnIds = orderedColumnIds.filter((id: string) => id !== columnId);

    // Update the UI
    await getColumnsWithTasks(columns, newOrderedColumnIds);
    setBoard(currentBoard);

    // Update the perspective
    currentBoard.orderedColumnIds = JSON.stringify(newOrderedColumnIds);
    await currentBoard.update();

    // Delete the columns tasks and their links to the perspective
    const column = columns.find((col) => col.baseExpression === columnId);
    const taskIds = column.orderedTaskIds ? JSON.parse(column.orderedTaskIds) : [];
    const columnTasks = await Task.findAll(perspective, { where: { base: taskIds } });
    await Promise.all(
      columnTasks.map(async (task) => {
        // Delete the task model
        await task.delete();

        // Remove the tasks link to the perspective
        const linkQuery = new LinkQuery({
          source: channelId,
          predicate: 'ad4m://has_child',
          target: task.baseExpression,
        });
        const links = await perspective.get(linkQuery);
        await perspective.removeLinks(links);
      }),
    );

    // Delete the column model
    await column.delete();

    // Reset updating state
    updatingRef.current = false;
    setUpdating(false);
  }

  async function onDragEnd(dropResult: DropResult) {
    const { destination, source, draggableId, type } = dropResult;

    // If there is no column destination, do nothing
    if (!destination) return;

    // If the task is dropped in its original position, do not do anything
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    // Set updating state to block concurrent updates
    updatingRef.current = true;
    setUpdating(true);

    try {
      if (type === 'COLUMN') {
        // If the column is dropped in its original position, do nothing
        if (destination.index === source.index) return;

        // Optimistically update the column ordering in the UI to avoid flicker
        const newColumnsWithTasks = [...columnsWithTasks];
        const [movedColumn] = newColumnsWithTasks.splice(source.index, 1);
        newColumnsWithTasks.splice(destination.index, 0, movedColumn);
        setColumnsWithTasks(newColumnsWithTasks);

        // Update the perspective
        const currentBoard = (await TaskBoard.findAll(perspective, { source: channelId }))[0];
        const newOrderedColumnIds = JSON.parse(currentBoard.orderedColumnIds);
        newOrderedColumnIds.splice(source.index, 1);
        newOrderedColumnIds.splice(destination.index, 0, draggableId);
        currentBoard.orderedColumnIds = JSON.stringify(newOrderedColumnIds);
        await currentBoard.update();

        // Update the board state
        setBoard(currentBoard);

        return;
      }

      // If a task is dropped in a different column
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

  async function getColumnsWithTasks(newColumns: TaskColumn[], orderedColumnIds: string[]) {
    const newColumnsWithTasks = (await Promise.all(
      newColumns.map(async (column) => {
        // Get tasks and order them by the columns orderedTaskIds property
        const taskIds = column.orderedTaskIds ? JSON.parse(column.orderedTaskIds) : [];
        const columnTasks = await Task.findAll(perspective, { where: { base: taskIds } });
        const taskMap = new Map(columnTasks.map((t) => [t.baseExpression, t]));
        const orderedTasks = taskIds.map((id) => taskMap.get(id)).filter(Boolean);

        return { ...column, baseExpression: column.baseExpression, tasks: orderedTasks };
      }),
    )) as ColumnWithTasks[];

    // Filter and sort columns based on the board's orderedColumnIds
    const filteredColumns = newColumnsWithTasks.filter((col) => orderedColumnIds.includes(col.baseExpression));
    filteredColumns.sort(
      (a, b) => orderedColumnIds.indexOf(a.baseExpression) - orderedColumnIds.indexOf(b.baseExpression),
    );

    setColumnsWithTasks(filteredColumns);
  }

  // Initialise board on mount if not added to the perspective
  useEffect(() => {
    initialiseBoard();
  }, [perspective.uuid]);

  // Fetch agent profiles on component mount
  useEffect(() => {
    if (getProfile) getProfiles();
  }, [perspective.uuid, getProfile]);

  // Update columns with tasks when columns or tasks change, unless an update is ongoing
  useEffect(() => {
    if (board && !updatingRef.current) getColumnsWithTasks(columns, JSON.parse(board.orderedColumnIds));
  }, [board, columns, tasks]);

  return (
    <>
      {board ? (
        <div className={styles.board}>
          {/* Columns */}
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="board-droppable" direction="horizontal" type="COLUMN">
              {(provided) => (
                <div className={styles.board} ref={provided.innerRef} {...provided.droppableProps}>
                  {columnsWithTasks.map((column, index) => (
                    <Column
                      key={column.baseExpression}
                      perspective={perspective}
                      channelId={channelId}
                      agent={agent}
                      agentProfiles={agentProfiles}
                      columns={columns}
                      column={column}
                      updating={updating}
                      index={index}
                      deleteColumn={() => deleteColumn(column.baseExpression)}
                    />
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>

          {updating && <j-spinner />}

          {/* Create new column button */}
          <j-button variant="subtle" onClick={() => setShowNewColumnModal(true)}>
            <j-icon name="plus" size="sm" slot="start" />
          </j-button>
        </div>
      ) : (
        <j-flex a="center" j="center" gap="400">
          <j-text nomargin>Loading board...</j-text>
          <j-spinner size="sm" />
        </j-flex>
      )}

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
