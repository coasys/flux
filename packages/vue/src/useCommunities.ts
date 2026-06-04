import { ref, watch, ShallowRef } from 'vue';
import { PerspectiveProxy, PerspectiveState } from '@coasys/ad4m';
import { Community } from '@coasys/flux-api';
import { getMetaFromLinks } from '@coasys/flux-utils';

/** Community data as stored by useCommunities — may be a real model instance or a fallback plain object */
interface CommunityData {
  id: string;
  name: string;
  description: string;
  image: string | { data_base64: string; name: string; file_type: string };
  thumbnail: string | { data_base64: string; name: string; file_type: string };
  neighbourhoodUrl?: string;
  uuid?: string;
  author?: string;
  timestamp?: Date;
  state?: PerspectiveState | null;
}

function getNeighbourhoodMeta(p: PerspectiveProxy): { name: string; description: string } {
  try {
    const links = p.neighbourhood?.data?.meta?.links || [];
    const meta = getMetaFromLinks(links);
    return { name: meta.name || '', description: meta.description || '' };
  } catch {
    return { name: '', description: '' };
  }
}

async function getCommunity(p: PerspectiveProxy): Promise<CommunityData> {
  const results = await Community.findAll(p, {});
  if (results.length > 0) {
    return results[0];
  } else {
    try {
      const meta = getNeighbourhoodMeta(p);
      return {
        uuid: p.uuid,
        author: '',
        timestamp: new Date(),
        name: p.name || meta.name || 'Unkown Community',
        description: meta.description || '',
        image: '',
        thumbnail: '',
        neighbourhoodUrl: p.sharedUrl!,
        id: '',
        state: p.state,
      } as CommunityData;
    } catch (e) {
      return {
        uuid: p.uuid,
        author: '',
        timestamp: new Date(),
        name: p.name || 'Unkown Community',
        description: '',
        image: '',
        thumbnail: '',
        neighbourhoodUrl: p.sharedUrl!,
        id: '',
        state: p.state,
      } as CommunityData;
    }
  }
}

export function useCommunities(
  neighbourhoods: ShallowRef<{
    [x: string]: PerspectiveProxy;
  }>,
) {
  let communities = ref<{ [x: string]: CommunityData }>({});

  watch(
    neighbourhoods,
    (newNeighbourhoods) => {
      Object.keys(communities.value).forEach((uuid) => {
        const stillExist = newNeighbourhoods[uuid] ? true : false;
        if (!stillExist) {
          delete communities.value[uuid];
        }
      });

      Object.entries(newNeighbourhoods).forEach(async ([uuid, p]) => {
        p.addSyncStateChangeListener((_state: PerspectiveState) => {
          getCommunity(p).then((community) => {
            communities.value = { ...communities.value, [p.uuid]: community };
          });
          return null;
        });

        const community = await getCommunity(p);
        communities.value = { ...communities.value, [p.uuid]: community };
      }, {});
    },
    { immediate: true },
  );

  return { communities };
}
