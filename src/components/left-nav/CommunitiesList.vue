<template>
  <div class="left-nav__communities-list">
    <community-avatar
      v-for="community in getCommunities"
      :key="community.value.perspective"
      :community="community"
    ></community-avatar>
    <create-community-icon></create-community-icon>
  </div>
</template>

<script lang="ts">
import { ADD_LINK, PUB_KEY_FOR_LANG } from "@/core/graphql_queries";
import { useLazyQuery, useMutation } from "@vue/apollo-composable";
import { defineComponent, ref } from "vue";
import CommunityAvatar from "./../ui/avatar/CommunityAvatar.vue";
import CreateCommunityIcon from './community-operation/CreateCommunityIcon.vue';
import ad4m from "@perspect3vism/ad4m-executor";

export default defineComponent({
  setup() {
    const currentQueryLang = ref("");
    const perspectiveUuid = ref("");
    const linkData = ref({});
    const activeAgentRef = ref();
    
    const pubKeyForLang = useLazyQuery<{
      pubKeyForLanguage: string;
    }>(PUB_KEY_FOR_LANG, () => {
      return { lang: currentQueryLang.value };
    });

    const { mutate: addLink, error: addLinkError } = useMutation<{
      addLink: ad4m.LinkExpression;
    }>(ADD_LINK, () => {
      return {
      variables: {
        perspectiveUUID: perspectiveUuid.value,
        link: JSON.stringify(linkData.value),
      },
    }});

    return {
      pubKeyForLang,
      currentQueryLang,
      addLink,
      linkData,
      activeAgentRef,
      perspectiveUuid,
    }
  },
  methods: {
    getPubKeyForLang(lang: string): Promise<string> {
      this.currentQueryLang = lang;
      return new Promise((resolve, reject) => {
        this.pubKeyForLang.onResult((result) => {
          resolve(result.data.pubKeyForLanguage);
        });
        this.pubKeyForLang.onError((error) => {
          reject(error);
        });
        this.pubKeyForLang.load();
      });
    },
    createLink(link: ad4m.Link): Promise<ad4m.LinkExpression> {
      this.linkData = link;
      return new Promise((resolve, reject) => {
        this.addLink().then((addLinkResp) => {
          resolve(addLinkResp.data!.addLink);
        });
      });
    },
    noDelaySetInterval(func: () => void, interval: number) {
      func();

      return setInterval(func, interval);
    },
    async setActiveAgents() {
      const communities = this.$store.getters.getCommunities;

      for (const community of communities) {
        const channels = community.value.channels;

        for (const channel of channels) {
          this.perspectiveUuid = channel.perspective;

          let channelScPubKey = await this.getPubKeyForLang(channel.linkLanguageAddress);

          this.activeAgentRef = this.noDelaySetInterval(async () => {
            let addActiveAgentLink = await this.createLink({
              source: "active_agent",
              target: channelScPubKey,
              predicate: "*",
            });

            console.log("Created active agent link with result", addActiveAgentLink);
          }, 600000);
        }
      }
    }
  },
  computed: {
    getCommunities() {
      const communities = this.$store.getters.getCommunities;

      this.setActiveAgents();

      return communities;
    },
  },

  components: { CommunityAvatar, CreateCommunityIcon },
});
</script>

<style lang="scss" scoped>
.left-nav__communities-list {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}
</style>