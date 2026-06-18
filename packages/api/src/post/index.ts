import { Ad4mModel, HasMany, Flag, Model, Property, fileToDataUri } from '@coasys/ad4m';
import { community } from '@coasys/flux-constants';

import { EntryType } from '@coasys/flux-types';
import Message from '../message';

const { BODY, IMAGE, TITLE, URL, ENTRY_TYPE } = community;

@Model({ name: 'Post' })
export class Post extends Ad4mModel {
  @Flag({ through: ENTRY_TYPE, value: EntryType.Post })
  type: string;

  @Property({ through: TITLE })
  title: string;

  @Property({ through: BODY })
  body: string;

  @Property({
    through: IMAGE,
    resolveLiteral: false,
    transform: fileToDataUri,
  })
  image: string;

  @Property({ through: URL })
  url: string;

  @HasMany(() => Message)
  comments: Message[] = [];
}

export default Post;
