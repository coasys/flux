import { Ad4mModel, Literal, makeRandomPrologAtom, PerspectiveProxy } from '@coasys/ad4m';
import { useModel } from '@coasys/ad4m-react-hooks';
import { AgentClient } from '@coasys/ad4m/lib/src/agent/AgentClient';
import { Profile } from '@coasys/flux-types';
import { useEffect, useMemo } from 'preact/hooks';
import { useState } from 'react';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import Card from '../Card';
import CardDetails from '../CardDetails';
import styles from './Board.module.css';

// @ts-ignore
import taskSDNA from './Task.pl?raw';

type BoardProps = {
  perspective: PerspectiveProxy;
  source: string;
  agent: AgentClient;
  getProfile: (did: string) => Promise<Profile>;
};
type NamedOption = { value: string; label: string };
type NamedOptions = Record<string, NamedOption[]>;

export default function Board({ perspective, source, agent, getProfile }: BoardProps) {
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [currentTask, setCurrentTask] = useState<
    (Ad4mModel & { assignees: string[]; name: string; title: string }) | null
  >(null);
  const [columnName, setColumnName] = useState('');
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedProperty, setSelectedProperty] = useState('');
  const [namedOptions, setNamedOptions] = useState<NamedOptions>({});
  const [tasks, setTasks] = useState([]);
  const [agentProfiles, setAgentProfiles] = useState<Profile[]>([]);
  const [isNeighbourhoodAuthor, setIsNeighbourhoodAuthor] = useState(false);

  async function getProfiles() {
    const others = await perspective.getNeighbourhoodProxy().otherAgents();
    const me = await agent.me();
    const profiles = await Promise.all([me.did, ...others].map(getProfile));
    setAgentProfiles(profiles);
  }

  const { entries } = useModel({ perspective, model: selectedClass, query: { source } });

  const data = useMemo(() => {
    return transformData(tasks, selectedProperty, namedOptions[selectedProperty] || []);
  }, [JSON.stringify(tasks), selectedProperty, perspective.uuid, namedOptions]);

  async function setValue(model, property, value) {
    const setter = `set${property.charAt(0).toUpperCase() + property.slice(1)}`;
    await model[setter](value);
  }

  async function createNewTodo(property, value) {
    const baseExpression = Literal.from(makeRandomPrologAtom(24)).toUrl();
    //@ts-ignore
    const model = (await perspective.createSubject(selectedClass, baseExpression)) as Ad4mModel;
    await setValue(model, property, value);
    // link to channel
    await perspective.addLinks([{ source, predicate: 'ad4m://has_child', target: baseExpression }]);
  }

  async function onDragEnd(result) {
    const { destination, source, draggableId } = result;

    // If there is no destination, do not do anything
    if (!destination) return;

    // If the draggable is dropped in its original position, do not do anything
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const status = destination.droppableId;

    setTasks((oldTasks) => {
      const changedTask = oldTasks.find((t) => t.baseExpression === draggableId);
      if (changedTask) {
        changedTask[selectedProperty] = status;
        changedTask.update();
      }

      const newTasks = oldTasks.map((t) => (t.baseExpression === draggableId ? changedTask : t));
      return newTasks;
    });

    // update state
    const model = await perspective.getSubjectProxy(draggableId, selectedClass);
    await setValue(model, selectedProperty, status);
  }

  async function addColumn() {
    // Get the atom for the selected class ("Task", "Todo", etc.)
    const res = await perspective.infer(`subject_class("${selectedClass}", Atom)`);
    const atom = res?.[0]?.Atom;
    if (atom) {
      // Create a new column with the given name
      const value = `task://${columnName.toLowerCase()}`;
      const sdnaCode = `property_named_option(${atom}, "${selectedProperty}", "${value}", "${columnName}").`;
      await perspective.addSdna(columnName, sdnaCode, 'custom');

      // Reload the columns
      loadColumns();
    } else {
      throw new Error(`No atom found for class "${selectedClass}"`);
    }

    // Reset the column name and hide the modal
    setColumnName('');
    setShowAddColumn(false);
  }

  function transformData(tasks: Ad4mModel[], property: string, options: NamedOption[]) {
    const defaultColumns = { Unknown: { id: 'unknown', title: 'unknown', taskIds: [] } };
    options.forEach((opt) => (defaultColumns[opt.value] = { id: opt.value, title: opt.label, taskIds: [] }));

    // Create a map of task IDs to their full Ad4mModel instances
    const taskMap = {};
    tasks.forEach((task) => (taskMap[task.baseExpression] = task));

    // Organize tasks into columns while preserving the full Ad4mModel instances
    const columns = { ...defaultColumns };
    tasks.forEach((task) => {
      const columnId = task[property] || 'unknown';
      if (!columns[columnId]) columns[columnId] = { id: columnId, title: columnId, taskIds: [] };
      columns[columnId].taskIds.push(task.baseExpression);
    });

    return {
      tasks: taskMap, // This now contains the full Ad4mModel instances
      columns,
      columnOrder: options.map((c) => c.value),
    };
  }

  async function getNamedOptions(perspective, className): Promise<NamedOptions> {
    return perspective
      .infer(`subject_class("${className}", Atom), property_named_option(Atom, Property, Value, Label).`)
      .then((res) => {
        if (res?.length) {
          const result = {};
          res.forEach((option) => {
            if (!result[option.Property]) result[option.Property] = [];
            result[option.Property].push({ label: option.Label, value: option.Value });
          });
          return result;
        } else {
          return {};
        }
      });
  }

  function loadColumns() {
    getNamedOptions(perspective, selectedClass).then((namedOpts) => {
      setNamedOptions(namedOpts);
      Object.keys(namedOpts).forEach((key, index) => {
        if (index === 0) setSelectedProperty(key);
      });
    });
  }

  function addTaskToColumn(columns, task, propertyName) {
    const result = {};
    Object.keys(columns).forEach((key) => {
      const column = columns[key];
      result[key] = {
        ...column,
        taskIds: task[propertyName] === column.id ? [...column.taskIds, task.baseExpression] : column.taskIds,
      };
    });
    return result;
  }

  function getClasses(perspective: PerspectiveProxy, source) {
    return perspective
      .infer(`subject_class(ClassName, Atom), property_named_option(Atom, Property, Value, Name).`)
      .then((result) => {
        if (Array.isArray(result)) {
          const uniqueClasses = [...new Set(result.map((c) => c.ClassName))];
          return uniqueClasses;
        } else {
          return [];
        }
      });
  }

  async function checkNeighbourhoodAuthor() {
    const me = await agent.me();
    setIsNeighbourhoodAuthor(perspective.neighbourhood.author === me.did);
  }

  useEffect(() => {
    // Check and display the add column button if we are the neighbourhood author
    checkNeighbourhoodAuthor();

    // Add the Task SDNA if it doesn't exist
    perspective.infer(`subject_class("Task", Atom)`).then((hasTask) => {
      if (!hasTask) {
        perspective
          .addSdna('Task', taskSDNA, 'subject_class')
          .then(() => getClasses(perspective, source).then(setClasses));
      }
    });
  }, [perspective.uuid]);

  useEffect(() => {
    if (getProfile) getProfiles();
  }, [perspective.uuid, getProfile]);

  useEffect(() => {
    setTasks(entries);
  }, [JSON.stringify(entries), perspective.uuid]);

  useEffect(() => {
    getClasses(perspective, source).then((classes) => setClasses(classes));
    loadColumns();
  }, [perspective.uuid, selectedClass]);

  useEffect(() => {
    setSelectedClass(classes[0] || '');
  }, [classes.length]);

  return (
    <>
      <j-box pb="500">
        <j-flex gap="300">
          <select className={styles.select} onChange={(e) => setSelectedClass(e.target.value)} value={selectedClass}>
            <option disabled selected>
              Select type
            </option>
            {classes.map((className) => (
              <option key={className} value={className}>
                {className}
              </option>
            ))}
          </select>
          <select className={styles.select} onChange={(e) => setSelectedProperty(e.target.value)}>
            {Object.keys(namedOptions).map((property) => (
              <option key={property} value={property}>
                {property}
              </option>
            ))}
          </select>
        </j-flex>
      </j-box>

      <div className={styles.board}>
        <div className={styles.columns}>
          <DragDropContext onDragEnd={onDragEnd}>
            {data.columnOrder.map((columnId, index) => {
              const column = data.columns[columnId];
              const tasks = column.taskIds.map((taskId) => data.tasks[taskId]);

              return (
                <div key={index} className={styles.column}>
                  <header className={styles.columnHeader}>
                    <j-text nomargin size="500" weight="600" color="black">
                      {column.title}
                    </j-text>
                  </header>
                  <div className={styles.columnContent}>
                    <Droppable droppableId={columnId}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`${styles.tasks} ${snapshot.isDraggingOver ? styles.isDraggingOver : ''}`}
                        >
                          {tasks.map((task, index) => (
                            <Draggable key={task.baseExpression} draggableId={task.baseExpression} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`${styles.task} ${snapshot.isDragging ? styles.isDragging : ''}`}
                                >
                                  <Card
                                    perspective={perspective}
                                    onClick={() => setCurrentTask(task)}
                                    task={task}
                                    agentProfiles={agentProfiles}
                                  />
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
                    <j-button variant="link" onClick={() => createNewTodo(selectedProperty, columnId)}>
                      Add card
                      <j-icon name="plus" slot="start" />
                    </j-button>
                  </footer>
                </div>
              );
            })}
            {isNeighbourhoodAuthor && selectedClass && (
              <div>
                <j-button variant="subtle" onClick={() => setShowAddColumn(true)}>
                  <j-icon name="plus" size="sm" slot="start" />
                </j-button>
              </div>
            )}
          </DragDropContext>
        </div>
      </div>
      {currentTask && (
        <j-modal
          open={currentTask ? true : false}
          // @ts-ignore
          onToggle={(e) => setCurrentTask(e.currentTarget.open ? currentTask : null)}
        >
          <CardDetails
            agent={agent}
            perspective={perspective}
            channelId={source}
            task={currentTask}
            selectedClass={selectedClass}
            onDeleted={() => setCurrentTask(null)}
            agentProfiles={agentProfiles}
          />
        </j-modal>
      )}
      {/* @ts-ignore */}
      <j-modal open={showAddColumn} onToggle={(e) => setShowAddColumn(e.currentTarget.open)}>
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
              value={columnName}
              onInput={(e: any) => setColumnName(e.target.value)}
            />
            <j-button variant="primary" onClick={addColumn} full size="lg">
              Create
            </j-button>
          </j-flex>
        </j-box>
      </j-modal>
    </>
  );
}
