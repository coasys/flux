import { ModelOptions, Ad4mModel, Flag, Property, Collection } from '@coasys/ad4m';
import Message from '../message';

@ModelOptions({ name: 'Task' })
export default class Task extends Ad4mModel {
  @Flag({
    through: 'flux://entry_type',
    value: 'flux://has_task',
  })
  type: string;

  @Property({
    through: 'flux://task_name',
    writable: true,
  })
  taskName: string;

  @Collection({
    through: 'flux://task_assignee',
  })
  assignees: string[] = [];

  @Collection({
    through: 'ad4m://has_child',
    where: { isInstance: Message },
  })
  comments: string[] = [];
}
