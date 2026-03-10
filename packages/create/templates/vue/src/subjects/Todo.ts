import { Model, Property, Flag, Ad4mModel } from '@coasys/ad4m';

@Model({
  name: 'Todo',
})
export default class Todo extends Ad4mModel {
  @Flag({
    through: 'flux://entry_type',
    value: 'flux://has_todo',
  })
  type: string;

  @Property({
    through: 'rdf://title',
  })
  title: string;

  @Property({
    through: 'rdf://description',
  })
  desc: string;

  @Property({
    through: 'rdf://status',
  })
  done: boolean;
}
