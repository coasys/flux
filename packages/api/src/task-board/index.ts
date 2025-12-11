import { ModelOptions, Ad4mModel, Flag, Property } from '@coasys/ad4m';

@ModelOptions({ name: 'TaskBoard' })
export default class TaskBoard extends Ad4mModel {
  @Flag({
    through: 'flux://entry_type',
    value: 'flux://has_task_board',
  })
  type: string;

  @Property({
    through: 'flux://board_name',
    writable: true,
  })
  boardName: string;

  @Property({
    through: 'flux://ordered_column_ids',
    resolveLanguage: 'literal',
    writable: true,
  })
  orderedColumnIds: string;
}
