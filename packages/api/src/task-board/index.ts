import { Model, Ad4mModel, Flag, Property } from '@coasys/ad4m';

@Model({ name: 'TaskBoard' })
export default class TaskBoard extends Ad4mModel {
  @Flag({
    through: 'flux://entry_type',
    value: 'flux://has_task_board',
  })
  type: string;

  @Property({
    through: 'flux://board_name',
  })
  boardName: string;

  @Property({
    through: 'flux://ordered_column_ids',
  })
  orderedColumnIds: string;
}
