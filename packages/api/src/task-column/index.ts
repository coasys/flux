import { ModelOptions, Ad4mModel, Flag, Property } from '@coasys/ad4m';

@ModelOptions({ name: 'TaskColumn' })
export default class TaskColumn extends Ad4mModel {
  @Flag({
    through: 'flux://entry_type',
    value: 'flux://has_task_column',
  })
  type: string;

  @Property({
    through: 'flux://column_name',
    writable: true,
  })
  columnName: string;

  @Property({
    through: 'flux://ordered_task_ids',
    resolveLanguage: 'literal',
    writable: true,
  })
  orderedTaskIds: string;
}
