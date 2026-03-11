import { Model, Property, Flag, Ad4mModel } from '@coasys/ad4m';

@Model({
  name: 'NillionUserUser',
})
export default class NillionUser extends Ad4mModel {
  @Flag({
    through: 'flux://entry_type',
    value: 'flux://nillion_user',
  })
  type: String;

  @Property({
    through: 'flux://nillion_user_id',
  })
  userId: String;
}
