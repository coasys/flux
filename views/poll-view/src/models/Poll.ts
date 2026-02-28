import { Model, Flag, Property, Ad4mModel, HasMany } from '@coasys/ad4m';
import Answer from './Answer';

@Model({
  name: 'Poll',
})
export default class Poll extends Ad4mModel {
  @Flag({
    through: 'flux://entry_type',
    value: 'flux://has_poll',
  })
  type: string;

  @Property({
    through: 'rdf://title',
  })
  title: string;

  @Property({
    through: 'rdf://description',
  })
  description: string;

  @Property({
    through: 'flux://vote_type',
  })
  voteType: 'single-choice' | 'multiple-choice' | 'weighted-choice';

  @Property({
    through: 'flux://poll_answers_locked',
  })
  answersLocked: boolean;

  @HasMany(() => Answer, { through: 'flux://has_poll_answer' })
  answers: Answer[] = [];
}
