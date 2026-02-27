import { Model, Ad4mModel, Flag, Property } from '@coasys/ad4m';

@Model({ name: 'TaskColumn' })
export default class TaskColumn extends Ad4mModel {
  @Flag({
    through: 'flux://entry_type',
    value: 'flux://has_task_column',
  })
  type: string;

  @Property({
    through: 'flux://column_name',
  })
  columnName: string;

  @Property({
    through: 'flux://ordered_task_ids',
  })
  orderedTaskIds: string;
}
