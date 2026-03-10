import { Model, Ad4mModel, Flag, Property, HasMany } from '@coasys/ad4m';
import Message from '../message';

@Model({ name: 'Task' })
export default class Task extends Ad4mModel {
  @Flag({ through: 'flux://entry_type', value: 'flux://has_task' })
  type: string;

  @Property({ through: 'flux://task_name' })
  taskName: string;

  @HasMany({ through: 'flux://task_assignee' })
  assignees: string[] = [];

  @HasMany(() => Message)
  comments: Message[] = [];
}
