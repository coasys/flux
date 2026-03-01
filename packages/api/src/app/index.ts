import { community } from '@coasys/flux-constants';
import { EntryType } from '@coasys/flux-types';
import { Property, Model, Flag, Ad4mModel } from '@coasys/ad4m';

const { DESCRIPTION, NAME, ENTRY_TYPE } = community;

@Model({ name: 'App' })
export class App extends Ad4mModel {
  @Flag({ through: ENTRY_TYPE, value: EntryType.App })
  type: string;

  @Property({ through: NAME })
  name: string;

  @Property({ through: DESCRIPTION })
  description: string;

  @Property({ through: 'rdf://icon' })
  icon: string;

  @Property({ through: 'rdf://pkg' })
  pkg: string;
}

export default App;
