import { Ad4mModel, Collection, Flag, ModelOptions, Optional, Property } from '@coasys/ad4m';
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

@ModelOptions({
  name: 'Community',
})
export class Community extends Ad4mModel {
  @Flag({ through: ENTRY_TYPE, value: EntryType.Community })
  type: string;

  @Property({
    through: NAME,
    writable: true,
    resolveLanguage: 'literal',
  })
  name: string;

  @Property({
    through: DESCRIPTION,
    writable: true,
    resolveLanguage: 'literal',
  })
  description: string;

  @Optional({
    through: IMAGE,
    writable: true,
    resolveLanguage: FILE_STORAGE_LANGUAGE,
    //transform: (data) => (data?.data_base64 ? `data:image/png;base64,${data?.data_base64}` : data),
  })
  image: string | FileData;

  @Optional({
    through: THUMBNAIL,
    writable: true,
    resolveLanguage: FILE_STORAGE_LANGUAGE,
    //transform: (data) => (data ? `data:image/png;base64,${data?.data_base64}` : undefined),
  })
  thumbnail: string | FileData;

  @Collection({
    through: 'ad4m://has_child',
    where: {
      isInstance: Channel,
    },
  })
  channels: string[] = [];
}

export default Community;
