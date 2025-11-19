import { ModelOptions, Ad4mModel, Flag, Property } from '@coasys/ad4m';
import Task from '../task';

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

  // async tasks(): Promise<Task[]> {
  //   // find the task entities
  //   return await Task.findAll(this.perspective, { source: this.baseExpression });
  // }
}
