import { computed, ref, watch } from "vue";
import { Agent, AgentStatus } from "@perspect3vism/ad4m";
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

const status = ref<AgentStatus>({ isInitialized: false, isUnlocked: false });
const agent = ref<Agent | undefined>();
const isListening = ref(false);

export function useMe(client: AgentClient) {
  watch(
    () => client,
    async () => {
      if (!isListening.value) {
        status.value = await client.status();
        agent.value = await client.me();

        isListening.value = true;

        client.addAgentStatusChangedListener(async (s: AgentStatus) => {
          status.value = s;
        });

        client.addUpdatedListener(async (a: Agent) => {
          agent.value = a;
        });
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

  return { status, me: agent, profile };
}
