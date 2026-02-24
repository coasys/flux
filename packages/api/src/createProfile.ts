import { agents, languages, profile } from '@coasys/flux-constants';
import { resizeImage, dataURItoBlob, blobToDataURL, createLiteralLinks } from '@coasys/flux-utils';
import { Ad4mClient, Link, LinkExpression, LinkMutations } from '@coasys/ad4m';
import { Profile } from '@coasys/flux-types';

const { FILE_STORAGE_LANGUAGE } = languages;
const {
  FLUX_PROFILE,
  HAS_EMAIL,
  HAS_FAMILY_NAME,
  HAS_GIVEN_NAME,
  HAS_PROFILE_IMAGE,
  HAS_THUMBNAIL_IMAGE,
  HAS_USERNAME,
} = profile;

export interface Payload {
  givenName?: string;
  familyName?: string;
  username: string;
  email?: string;
  profileBackground?: string;
  profilePicture?: string;
  profileThumbnailPicture?: string;
  client: Ad4mClient;
}

export default async function ({
  givenName = '',
  familyName = '',
  email = '',
  username,
  profileThumbnailPicture,
  profileBackground,
  profilePicture,
  client,
}: Payload): Promise<Profile> {
  try {
    await client.languages.byAddress(FILE_STORAGE_LANGUAGE);

    const additions = [] as Link[];
    const removals = [] as LinkExpression[];

    let profileImage: null | string = null;
    let thumbnailImage: null | string = null;

    if (profilePicture) {
      const compressedProfileImage = await blobToDataURL(
        await resizeImage(dataURItoBlob(profilePicture as string), 0.6),
      );

      profileImage = await client.expression.create(
        {
          data_base64: compressedProfileImage,
          name: 'profile-image',
          file_type: 'image/png',
        },
        FILE_STORAGE_LANGUAGE,
      );

      const compressedpThumbnailImage = await blobToDataURL(
        await resizeImage(dataURItoBlob(profilePicture as string), 0.3),
      );

      thumbnailImage = await client.expression.create(
        {
          data_base64: compressedpThumbnailImage,
          name: 'thumbnail-image',
          file_type: 'image/png',
        },
        FILE_STORAGE_LANGUAGE,
      );

      additions.push(
        new Link({
          source: FLUX_PROFILE,
          target: profileImage,
          predicate: HAS_PROFILE_IMAGE,
        }),
      );

      additions.push(
        new Link({
          source: FLUX_PROFILE,
          target: thumbnailImage,
          predicate: HAS_THUMBNAIL_IMAGE,
        }),
      );
    }

    const literalLinks = await createLiteralLinks(client, FLUX_PROFILE, {
      ...(givenName && { [HAS_GIVEN_NAME]: givenName }),
      ...(familyName && { [HAS_FAMILY_NAME]: familyName }),
      ...(email && { [HAS_EMAIL]: email }),
      ...(username && { [HAS_USERNAME]: username }),
    });

    additions.push(...literalLinks);

    const agent = await client.agent.me();

    await client.agent.mutatePublicPerspective({
      additions,
      removals,
    } as LinkMutations);

    return {
      did: agent.did,
      username: username,
      email: email,
      givenName: givenName,
      familyName: familyName,
      profileBackground: '',
      profilePicture: profileImage || '',
      profileThumbnailPicture: thumbnailImage || '',
      bio: '',
    };
  } catch (e) {
    throw new Error(e);
  }
}
