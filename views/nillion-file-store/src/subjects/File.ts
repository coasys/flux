import { Model, Property, Flag, Ad4mModel } from '@coasys/ad4m';

@Model({
  name: 'NillionFile',
})
export default class File extends Ad4mModel {
  @Flag({
    through: 'flux://entry_type',
    value: 'flux://has_file',
  })
  type: String;

  @Property({
    through: 'flux://secretId',
  })
  secretId: String;

  @Property({
    through: 'flux://fileSize',
  })
  size: String;

  @Property({
    through: 'flux://storeId',
  })
  storeId: String;

  @Property({
    through: 'flux://file_name',
  })
  name: String;
}
