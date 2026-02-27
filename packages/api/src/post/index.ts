import { Ad4mModel, HasMany, Flag, Model, Property } from '@coasys/ad4m';
import { community, languages } from '@coasys/flux-constants';
import { EntryType } from '@coasys/flux-types';
import Message from '../message';

const { BODY, END_DATE, IMAGE, START_DATE, TITLE, URL, ENTRY_TYPE } = community;
const { FILE_STORAGE_LANGUAGE } = languages;

@Model({
  name: 'Post',
})
export class Post extends Ad4mModel {
  @Flag({
    through: ENTRY_TYPE,
    value: EntryType.Post,
  })
  type: string;

  @Property({
    through: TITLE,
  })
  title: string;

  @Property({
    through: BODY,
  })
  body: string;

  @Property({
    through: IMAGE,
    resolveLanguage: FILE_STORAGE_LANGUAGE,
    transform: (data) => (data ? `data:image/png;base64,${data?.data_base64}` : undefined),
  })
  image: string;

  @Property({ through: URL })
  url: string;

  @HasMany(() => Message, { through: 'ad4m://has_child' })
  comments: string[] = [];
}

export default Post;
