import { computed, ref, watch } from "vue";
import { Agent } from "@perspect3vism/ad4m";
import { AgentClient } from "@perspect3vism/ad4m/lib/src/agent/AgentClient";
import { mapLiteralLinks } from "@fluxapp/utils";
import { profile } from "@fluxapp/constants";
import { Profile } from "@fluxapp/types";

const {
  FLUX_PROFILE,
  HAS_BG_IMAGE,
  HAS_BIO,
  HAS_EMAIL,
  HAS_FAMILY_NAME,
  HAS_GIVEN_NAME,
  HAS_PROFILE_IMAGE,
  HAS_THUMBNAIL_IMAGE,
  HAS_USERNAME,
} = profile;

const agent = ref<Agent | null>(null);

export function useAgent(client: AgentClient, did: string | Function) {
  const didRef = typeof did === "function" ? (did as any) : ref(did);

  watch(
    [client, didRef],
    async ([c, d]) => {
      if (d) {
        agent.value = await client.byDID(d);
      }
    },
    { immediate: true }
  );

  const profile = computed<Profile | null>(() => {
    if (agent.value?.perspective) {
      const perspective = agent.value.perspective;
      return mapLiteralLinks(
        perspective.links.filter((e) => e.data.source === FLUX_PROFILE),
        {
          username: HAS_USERNAME,
          bio: HAS_BIO,
          givenName: HAS_GIVEN_NAME,
          email: HAS_EMAIL,
          familyName: HAS_FAMILY_NAME,
          profilePicture: HAS_PROFILE_IMAGE,
          profileThumbnailPicture: HAS_THUMBNAIL_IMAGE,
          profileBackground: HAS_BG_IMAGE,
        }
      ) as Profile;
    } else {
      return null;
    }
  });

  return { agent, profile };
}
