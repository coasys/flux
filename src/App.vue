<template>
  <router-view />
</template>

<script lang="ts">
import { useSubscription } from "@vue/apollo-composable";
import { defineComponent, watch } from "vue";
import {
  AD4M_SIGNAL,
  QUERY_EXPRESSION,
  LANGUAGE,
  ADD_LINK,
  PUB_KEY_FOR_LANG,
  SOURCE_PREDICATE_LINK_QUERY,
  INSTALL_SHARED_PERSPECTIVE,
} from "./core/graphql_queries";
import {
  agentRefreshDurationMs,
  channelRefreshDurationMs,
} from "./core/juntoTypes";
import { useStore } from "vuex";
import {
  ExpressionUIIcons,
  FeedType,
  SyncLevel,
  ChannelState,
  CommunityState,
} from "./store";
import ad4m from "@perspect3vism/ad4m-executor";
import { apolloClient } from "./main";
import { onError } from "@apollo/client/link/error";
import { logErrorMessages } from "@vue/apollo-util";

declare global {
  interface Window {
    api: any;
  }
}

export default defineComponent({
  name: "App",
  setup() {
    const store = useStore();
    var language = "";
    var expression = {};

    onError((error) => {
      if (process.env.NODE_ENV !== "production") {
        // can use error.operation.operationName to single out a query type.
        logErrorMessages(error);
      }
    });

    //Ad4m signal watcher
    const { result } = useSubscription(AD4M_SIGNAL);
    //Query expression handler
    const getExpression = (url: string): Promise<ad4m.Expression> => {
      return new Promise((resolve) => {
        const getExpression = apolloClient.query<{
          expression: ad4m.Expression;
        }>({ query: QUERY_EXPRESSION, variables: { url: url } });
        getExpression.then((result) => {
          resolve(result.data.expression);
        });
      });
    };

    //Get language UI handler
    const getLanguage = (language: string): Promise<ad4m.Language> => {
      return new Promise((resolve) => {
        const getLanguage = apolloClient.query<{ language: ad4m.Language }>({
          query: LANGUAGE,
          variables: { address: language },
        });
        getLanguage.then((result) => {
          console.log("Got result", result);
          resolve(result.data.language);
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

    async function getPerspectiveChannels() {
      noDelaySetInterval(async () => {
        //TODO: only do when application window is open
        //Or perhaps this only gets run once a user clicks on a given community?
        const communities: CommunityState[] = store.getters.getCommunities;
        for (const community of communities) {
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
        }
      }, channelRefreshDurationMs);
    }

    async function runActiveAgents(skip: boolean) {
      console.log("Running active agent check with skip", skip);
      if (skip == false || skip == undefined) {
        const communities = store.getters.getCommunities;

        for (const community of communities) {
          const channels = community.value.channels;

          for (const channel of channels) {
            let channelScPubKey = await pubKeyForLang(
              channel.linkLanguageAddress
            );
            console.log("Got pub key for language", channelScPubKey);
            let addActiveAgentLink = await addLink(channel.perspective, {
              source: "active_agent",
              target: channelScPubKey,
              predicate: "*",
            });
            console.log(
              "Created active agent link with result",
              addActiveAgentLink
            );
          }
        }
      } else {
        skip = false;
      }
    }

    async function setActiveAgents(skip: boolean, diffTime: number) {
      setTimeout(() => {
        noDelaySetInterval(async () => {
          runActiveAgents(skip);
        }, agentRefreshDurationMs);
      }, diffTime);
    }

    //Watch for agent unlock to set off running queries
    store.watch(
      (state) => state.agentUnlocked,
      async (newValue) => {
        if (newValue.value == true) {
          //TODO: these are the kind of operations that are best done in a loading screen
          let lastOpen = store.getters.getApplicationStartTime.value;
          let now = new Date();
          store.commit({
            type: "updateApplicationStartTime",
            value: now,
          });

          let difOld = new Date(lastOpen);
          let dif = now.getTime() - difOld.getTime();
          if (dif > agentRefreshDurationMs) {
            await setActiveAgents(false, dif);
          } else {
            await setActiveAgents(true, dif);
          }
          await getPerspectiveChannels();

          //TODO: this is probably not needed here and should work fine on join/create of community
          let expressionLangs =
            store.getters.getAllExpressionLanguagesNotLoaded;
          for (const [, lang] of expressionLangs.entries()) {
            let language = await getLanguage(lang);
            console.log("Got language", language);
            if (language != null) {
              let uiData: ExpressionUIIcons = {
                languageAddress: language!.address!,
                createIcon: language!.constructorIcon!.code!,
                viewIcon: language!.iconFor!.code!,
              };
              store.commit({
                type: "addExpressionUI",
                value: uiData,
              });
            }
            await sleep(50);
          }
        }
      }
    );

    //Watch for incoming signals to get expression data
    watch(result, async (data) => {
      let signal = JSON.parse(data.signal.signal);
      language = data.signal.language;
      expression = signal.data.payload;
      console.log(
        new Date().toISOString(),
        "SIGNAL RECEIVED IN UI: Coming from language",
        language
      );
      if (
        //@ts-ignore
        Object.prototype.hasOwnProperty.call(expression.data, "source") &&
        //@ts-ignore
        Object.prototype.hasOwnProperty.call(expression.data, "target") &&
        //@ts-ignore
        Object.prototype.hasOwnProperty.call(expression.data, "predicate")
      ) {
        //@ts-ignore
        if (expression.data.predicate == "sioc://content_of") {
          //@ts-ignore
          let getExprRes = await getExpression(expression.data.target);
          if (getExprRes == null) {
            for (let i = 0; i < 10; i++) {
              console.log("Retrying get of expression signal");
              //@ts-ignore
              getExprRes = await getExpression(expression.data.target);
              if (getExprRes != null) {
                break;
              }
              await sleep(20);
            }
            if (getExprRes == null) {
              throw Error("Could not get expression from link signal");
            }
          }
          console.log(
            new Date().toISOString(),
            "Got expression result back",
            getExprRes
          );
          store.commit({
            type: "addExpressionAndLinkFromLanguageAddress",
            value: {
              linkLanguage: language,
              //@ts-ignore
              link: expression.data,
              message: getExprRes,
            },
          });
        }
      }
    });

    function sleep(ms: number) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }

    function noDelaySetInterval(func: () => void, interval: number) {
      func();

      return setInterval(func, interval);
    }

    return {};
  },
  beforeCreate() {
    window.api.send("getLangPath");
    window.api.receive("getLangPathResponse", (data: string) => {
      console.log(`Received language path from main thread: ${data}`);
      this.$store.commit({
        type: "setLanguagesPath",
        value: data,
      });
    });
  },
});
</script>

<style lang="scss">
@import "src/assets/sass/main.scss";
</style>
