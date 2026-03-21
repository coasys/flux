import { Model, Flag, Property, Ad4mModel } from '@coasys/ad4m';

@Model({ name: 'Vote' })
export default class Vote extends Ad4mModel {
  @Flag({ through: 'flux://entry_type', value: 'flux://has_vote' })
  type: string;

  @Property({ through: 'flux://score' })
  score: number;
}
