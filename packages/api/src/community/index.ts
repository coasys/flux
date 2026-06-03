import { Ad4mModel, HasMany, Flag, Model, Property, fileToDataUri } from '@coasys/ad4m';
import { community, languages } from '@coasys/flux-constants';
import { EntryType } from '@coasys/flux-types';
import Channel from '../channel';

const { FILE_STORAGE_LANGUAGE } = languages;
const { DESCRIPTION, IMAGE, NAME, THUMBNAIL, ENTRY_TYPE, CHANNEL } = community;

interface FileData {
  name: string;
  file_type: string;
  data_base64: string;
}

@Model({ name: 'Community' })
export class Community extends Ad4mModel {
  @Flag({ through: ENTRY_TYPE, value: EntryType.Community })
  type: string;

  @Property({ through: NAME })
  name: string;

  @Property({ through: DESCRIPTION })
  description: string;

  @Property({
    through: IMAGE,
    resolveLanguage: FILE_STORAGE_LANGUAGE,
    transform: fileToDataUri,
  })
  image: string | FileData;

  @Property({
    through: THUMBNAIL,
    resolveLanguage: FILE_STORAGE_LANGUAGE,
    transform: fileToDataUri,
  })
  thumbnail: string | FileData;

  @HasMany({ through: CHANNEL })
  channels: string[] = [];
}

export default Community;
