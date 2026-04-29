import { Ad4mModel, Model, Property, HasMany } from '@coasys/ad4m';

@Model({ name: 'Task' })
export class Task extends Ad4mModel {
  @Property({
    through: 'rdf://name',
    resolveLanguage: 'literal',
    required: true,
    writable: true,
    initial: 'New task',
  })
  name: string = 'New task';

  @Property({
    through: 'rdf://status',
    writable: true,
    initial: 'task://todo',
    options: [
      { value: 'task://todo', label: 'todo' },
      { value: 'task://doing', label: 'doing' },
      { value: 'task://done', label: 'done' },
    ],
  })
  status: string = 'task://todo';

  @HasMany({ through: 'rdf://has_assignee' })
  assignees: string[] = [];
}
