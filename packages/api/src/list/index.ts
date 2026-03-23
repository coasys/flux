import { community } from '@coasys/flux-constants';
import { Property, HasMany, Model, Ad4mModel } from '@coasys/ad4m';

@Model({ name: 'List' })
export class List extends Ad4mModel {
  @Property({ through: community.NAME })
  name: string;

  @Property({ through: 'rdf://order' })
  order: string;

  @HasMany({ through: 'ad4m://has_child' })
  children: string[] = [];
}

export default List;
