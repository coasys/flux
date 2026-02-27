import { Ad4mModel, HasMany, Flag, Model, Property } from '@coasys/ad4m';
import { community, languages } from '@coasys/flux-constants';
import { EntryType } from '@coasys/flux-types';
import Channel from '../channel';

const { FILE_STORAGE_LANGUAGE } = languages;
const { DESCRIPTION, IMAGE, NAME, THUMBNAIL, ENTRY_TYPE } = community;

interface FileData {
  name: string;
  file_type: string;
  data_base64: string;
}

@Model({
  name: 'Community',
})
export class Community extends Ad4mModel {
  @Flag({ through: ENTRY_TYPE, value: EntryType.Community })
  type: string;

  @Property({
    through: NAME,
  })
  name: string;

  @Property({
    through: DESCRIPTION,
  })
  description: string;

  @Property({
    through: IMAGE,
    resolveLanguage: FILE_STORAGE_LANGUAGE,
    transform: (data) =>
      data?.data_base64 ? `data:${data?.file_type || 'image/png'};base64,${data?.data_base64}` : data,
  })
  image: string | FileData;

  @Property({
    through: THUMBNAIL,
    resolveLanguage: FILE_STORAGE_LANGUAGE,
    transform: (data) =>
      data?.data_base64 ? `data:${data?.file_type || 'image/png'};base64,${data?.data_base64}` : data,
  })
  thumbnail: string | FileData;

  @HasMany({ through: 'ad4m://has_child' })
  channels: string[] = [];
}

export default Community;
