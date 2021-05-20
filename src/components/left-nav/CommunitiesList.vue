<template>
  <div class="left-nav__communities-list">
    <community-avatar
      v-for="community in getCommunities"
      :key="community.value.perspective"
      :community="community"
      :getPerspectiveChannelsAndMetaData="getPerspectiveChannelsAndMetaData"
    ></community-avatar>
    <create-community-icon></create-community-icon>
  </div>
</template>

<script lang="ts">
import { useStore } from "vuex";
import { apolloClient } from "@/main";
import { defineComponent, onMounted, onUnmounted, ref } from "vue";
import CommunityAvatar from "@/components/ui/avatar/CommunityAvatar.vue";
import CreateCommunityIcon from "./community-operation/CreateCommunityIcon.vue";
import { channelRefreshDurationMs } from "@/core/juntoTypes";
import { ChannelState, CommunityState, FeedType, MembraneType } from "@/store";
import { getLinks } from "@/core/queries/getLinks";
import { installSharedPerspective } from "@/core/mutations/installSharedPerspective";
import { PUB_KEY_FOR_LANG } from "@/core/graphql_queries";
import { getExpression } from "@/core/queries/getExpression";
import { expressionGetRetries, expressionGetDelayMs } from "@/core/juntoTypes";

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

    const getGroupExpressionLinks = (
      perspectiveUUID: string,
      linkLanguageAddress: string
    ) => {
      return getLinks(
        perspectiveUUID,
        `${linkLanguageAddress}://self`,
        "rdf://class"
      );
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
      //TODO: derive membraneType from link on sharedPerspective
      //For now its hard coded inherited since we dont support anything else
      let now = new Date();
      //TODO: lets use a constructor on the ChannelState type
      return {
        name: installedChannelPerspective.name!,
        perspective: installedChannelPerspective.uuid!,
        type: FeedType.Signaled,
        createdAt: now,
        linkLanguageAddress:
          installedChannelPerspective.sharedPerspective!.linkLanguages![0]!
            .address!,
        currentExpressionLinks: [],
        currentExpressionMessages: [],
        sharedPerspectiveUrl: sharedPerspectiveUrl,
        membraneType: MembraneType.Inherited,
        groupExpressionRef: "",
      };
    };

    const getPerspectiveChannelsAndMetaData = async (
      community: CommunityState
    ) => {
      clearInterval(noDelayRef.value);

      const test = noDelaySetInterval(async () => {
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
                  element.sharedPerspectiveUrl === channelLinks[i].data!.target
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
          //NOTE/TODO: if this becomes too heavy for certain communities this might be best executed via a refresh button
          let groupExpressionLinks = await getGroupExpressionLinks(
            //@ts-ignore
            community.value.perspective,
            //@ts-ignore
            community.value.linkLanguageAddress
          );
          if (groupExpressionLinks != null && groupExpressionLinks.length > 0) {
            if (
              //@ts-ignore
              community.value.groupExpressionRef !=
              groupExpressionLinks[0].data!.target!
            ) {
              //@ts-ignore
              let getExprRes = await getExpression(
                groupExpressionLinks[0].data!.target!
              );
              if (getExprRes == null) {
                for (let i = 0; i < expressionGetRetries; i++) {
                  console.log("Retrying get of expression signal");
                  //@ts-ignore
                  getExprRes = await getExpression(
                    groupExpressionLinks[0].data!.target!
                  );
                  if (getExprRes != null) {
                    break;
                  }
                  await sleep(expressionGetDelayMs);
                }
                if (getExprRes == null) {
                  console.warn(
                    "Could not get expression from group expression link"
                  );
                  return;
                }
              }
              let groupExpData = JSON.parse(getExprRes.data!);
              console.log(
                "Got new group expression data for community",
                groupExpData
              );
              store.commit({
                type: "updateCommunityMetadata",
                value: {
                  //@ts-ignore
                  community: community.value.perspective,
                  name: groupExpData["foaf:name"],
                  description: groupExpData["foaf:description"],
                  groupExpressionRef: groupExpressionLinks[0].data!.target,
                },
              });
            }
          }
        }
      }, channelRefreshDurationMs);

      noDelayRef.value = test;
    };

    onMounted(() => {
      const community = store.getters.getCurrentCommunity;
      if (community != null) {
        getPerspectiveChannelsAndMetaData(community);
      }
    });

    onUnmounted(() => {
      clearInterval(noDelayRef.value);
    });

    return {
      getPerspectiveChannelsAndMetaData,
    };
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
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow-y: scroll;
  overflow-x: visible;
  margin-bottom: 25vh;

  &::-webkit-scrollbar {
    display: none;
  }
}
</style>
