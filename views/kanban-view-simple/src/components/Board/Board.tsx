import { PerspectiveProxy, LinkQuery } from '@coasys/ad4m';
import { useModel } from '@coasys/ad4m-react-hooks';
import { AgentClient } from '@coasys/ad4m/lib/src/agent/AgentClient';
import { Profile } from '@coasys/flux-types';
import { useState, useEffect, Fragment } from 'react';
import { TaskColumn } from '@coasys/flux-api';
import { DragDropContext, DropResult } from 'react-beautiful-dnd';
import styles from './Board.module.scss';
import Column from '../Column';

type BoardProps = {
  perspective: PerspectiveProxy;
  source: string;
  agent: AgentClient;
  getProfile: (did: string) => Promise<Profile>;
};

export default function Board({ perspective, source, agent, getProfile }: BoardProps) {
  const [showNewColumnModal, setShowNewColumnModal] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnLoading, setNewColumnLoading] = useState(false);
  const [agentProfiles, setAgentProfiles] = useState<Partial<Profile>[]>([]); // TODO: remove Partial

  const { entries: columns } = useModel({ perspective, model: TaskColumn, query: { source } });

  async function getProfiles() {
    const others = await perspective.getNeighbourhoodProxy().otherAgents();
    const me = await agent.me();
    const profiles = await Promise.all([me.did, ...others].map(getProfile));
    setAgentProfiles([...profiles, { did: 'a' }, { did: 'b' }]); // TODO: remove Partial
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

    // If the task is dropped in a different column
    if (destination.droppableId !== source.droppableId) {
      // Remove old link
      const oldLinks = await perspective.get(
        new LinkQuery({ source: source.droppableId, predicate: 'ad4m://has_child', target: draggableId }),
      );
      await perspective.removeLinks([oldLinks[0]]);

      // Update orderedTaskIds in source column
      const sourceColumn = columns.find((col) => col.baseExpression === source.droppableId);
      if (sourceColumn) {
        const orderedIds = JSON.parse(sourceColumn.orderedTaskIds);
        sourceColumn.orderedTaskIds = JSON.stringify(orderedIds.filter((id) => id !== draggableId));
        await sourceColumn.update();
      }

      // Add new link
      await perspective.addLinks([
        { source: destination.droppableId, predicate: 'ad4m://has_child', target: draggableId },
      ]);

      // Update orderedTaskIds in destination column
      const destinationColumn = columns.find((col) => col.baseExpression === destination.droppableId);
      if (destinationColumn) {
        const newOrderedTaskIds = JSON.parse(destinationColumn.orderedTaskIds);
        newOrderedTaskIds.splice(destination.index, 0, draggableId);
        destinationColumn.orderedTaskIds = JSON.stringify(newOrderedTaskIds);
        await destinationColumn.update();
      }
    } else {
      // If the task is reordered within the same column
      const column = columns.find((col) => col.baseExpression === source.droppableId);

      // Update orderedTaskIds in the column
      const newOrderedTaskIds = JSON.parse(column.orderedTaskIds);

      // Remove the task from its original position
      newOrderedTaskIds.splice(source.index, 1);

      // Insert the task at the new position
      newOrderedTaskIds.splice(destination.index, 0, draggableId);
      column.orderedTaskIds = JSON.stringify(newOrderedTaskIds);
      await column.update();
    }
  }

  // Fetch agent profiles on component mount
  useEffect(() => {
    if (getProfile) getProfiles();
  }, [perspective.uuid, getProfile]);

  return (
    <>
      <div className={styles.board}>
        {/* Columns */}
        <DragDropContext onDragEnd={updateTaskPosition}>
          {columns.map((column) => (
            <Column
              key={column.baseExpression}
              perspective={perspective}
              source={source}
              agent={agent}
              agentProfiles={agentProfiles}
              columns={columns}
              column={column}
            />
          ))}
        </DragDropContext>

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
