<template>
  <div class="left-nav__communities-list">
    <community-avatar
      v-for="community in getCommunities"
      :key="community.value.perspective"
      :community="community"
      :getPerspectiveChannels="getPerspectiveChannels"
    ></community-avatar>
    <create-community-icon></create-community-icon>
  </div>
</template>

<script lang="ts">
import CommunityAvatar from "./../ui/avatar/CommunityAvatar.vue";
import CreateCommunityIcon from './community-operation/CreateCommunityIcon.vue';
import { ADD_LINK, INSTALL_SHARED_PERSPECTIVE, PUB_KEY_FOR_LANG, SOURCE_PREDICATE_LINK_QUERY } from "@/core/graphql_queries";
import { channelRefreshDurationMs } from "@/core/juntoTypes";
import { apolloClient } from "@/main";
import { ChannelState, CommunityState, FeedType, SyncLevel } from "@/store";
import { defineComponent, onMounted, onUnmounted, ref, watch } from "vue";
import ad4m from "@perspect3vism/ad4m-executor";
import { useStore } from "vuex";

export default defineComponent({
  setup() {
    const store = useStore();
    let noDelayRef: any = ref();

    function noDelaySetInterval(func: () => void, interval: number) {
      func();

      return setInterval(func, interval);
    }

    function sleep(ms: number) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }
    
    const getLinks = (
      perspectiveUUID: string,
      source: string,
      predicate: string
    ): Promise<ad4m.LinkExpression[]> => {
      return new Promise((resolve) => {
        const getLinksQ = apolloClient.query<{ links: ad4m.LinkExpression[] }>({
          query: SOURCE_PREDICATE_LINK_QUERY,
          variables: { perspectiveUUID, source, predicate },
        });
        getLinksQ.then((result) => {
          resolve(result.data.links);
        });
      });
    };

    const addLink = (perspectiveUUID: string, link: ad4m.Link) => {
      return new Promise((resolve) => {
        const addLinkQ = apolloClient.mutate({
          mutation: ADD_LINK,
          variables: {
            perspectiveUUID: perspectiveUUID,
            link: JSON.stringify(link),
          },
        });

        addLinkQ.then((result) => {
          resolve(result.data);
        });
      });
    };

    const getChatChannelLinks = (
      perspectiveUUID: string,
      linkLanguageAddress: string
    ) => {
      return getLinks(
        perspectiveUUID,
        `${linkLanguageAddress}://self`,
        "sioc://has_space"
      );
    };

    const installSharedPerspective = (
      url: string
    ): Promise<ad4m.Perspective> => {
      return new Promise((resolve) => {
        const install = apolloClient.mutate<{
          installSharedPerspective: ad4m.Perspective;
        }>({
          mutation: INSTALL_SHARED_PERSPECTIVE,
          variables: {
            url: url,
          },
        });
        install.then((result) => {
          resolve(result.data!.installSharedPerspective);
        });
      });
    };

    const pubKeyForLang = (lang: string): Promise<string> => {
      return new Promise((resolve) => {
        const pubKey = apolloClient.query<{ pubKeyForLanguage: string }>({
          query: PUB_KEY_FOR_LANG,
          variables: { lang: lang },
        });
        pubKey.then((result) => {
          resolve(result.data.pubKeyForLanguage);
        });
      });
    };

    const joinChannelFromSharedLink = async (
      sharedPerspectiveUrl: string
    ): Promise<ChannelState> => {
      let installedChannelPerspective = await installSharedPerspective(
        sharedPerspectiveUrl
      );
      console.log(
        new Date(),
        "Installed with result",
        installedChannelPerspective
      );
      await sleep(1000);
      let channelScPubKey = await pubKeyForLang(
        installedChannelPerspective.sharedPerspective!.linkLanguages![0]!
          .address!
      );
      console.log(
        new Date(),
        "Got pub key for social context channel",
        channelScPubKey
      );
      await addLink(installedChannelPerspective.uuid!, {
        source: "active_agent",
        target: channelScPubKey,
        predicate: "*",
      });
      let now = new Date();
      return {
        name: installedChannelPerspective.name!,
        perspective: installedChannelPerspective.uuid!,
        type: FeedType.Dm,
        lastSeenMessageTimestamp: now,
        firstSeenMessageTimestamp: now,
        createdAt: now,
        linkLanguageAddress:
          installedChannelPerspective.sharedPerspective!.linkLanguages![0]!
            .address!,
        syncLevel: SyncLevel.Full,
        maxSyncSize: -1,
        currentExpressionLinks: [],
        currentExpressionMessages: [],
        sharedPerspectiveUrl: sharedPerspectiveUrl,
      };
    };

    const getPerspectiveChannels = async (community: CommunityState) => {
      clearInterval(noDelayRef.value);

      const test = noDelaySetInterval(async () => {
        //@ts-ignore
        console.log('acc', community.value.name);
        //TODO: only do when application window is open
        //Or perhaps this only gets run once a user clicks on a given community?
        let channelLinks = await getChatChannelLinks(
          //@ts-ignore
          community.value.perspective,
          //@ts-ignore
          community.value.linkLanguageAddress
        );
        if (channelLinks != null) {
          for (let i = 0; i < channelLinks.length; i++) {
            if (
              //@ts-ignore
              community.value.channels.find(
                (element: ChannelState) =>
                  element.sharedPerspectiveUrl ===
                  channelLinks[i].data!.target
              ) == undefined
            ) {
              console.log(
                "Found channel link",
                channelLinks[i],
                "Adding to channel"
              );
              let channel = await joinChannelFromSharedLink(
                channelLinks[i].data!.target!
              );
              store.commit({
                type: "addChannel",
                value: {
                  //@ts-ignore
                  community: community.value.perspective,
                  channel: channel,
                },
              });
            }
          }
        }
      }, channelRefreshDurationMs);

      noDelayRef.value = test;
    }

    onMounted(() => {
      const community = store.getters.getCurrentCommunity;

      getPerspectiveChannels(community);
    });

    onUnmounted(() => {
      clearInterval(noDelayRef.value);
    });

    return {
      getPerspectiveChannels,
    }
  },
  computed: {
    getCommunities() {
      const communities = this.$store.getters.getCommunities;

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