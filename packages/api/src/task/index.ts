import { Model, Ad4mModel, Flag, Property, HasMany } from '@coasys/ad4m';
import { community } from '@coasys/flux-constants';
import Message from '../message';

const { TASK_COMMENT } = community;

@Model({ name: 'Task' })
export default class Task extends Ad4mModel {
  @Flag({ through: 'flux://entry_type', value: 'flux://has_task' })
  type: string;

  @Property({ through: 'flux://task_name' })
  taskName: string;

  @HasMany({ through: 'flux://task_assignee' })
  assignees: string[] = [];

  @HasMany(() => Message, { through: TASK_COMMENT })
  comments: Message[] = [];
}
