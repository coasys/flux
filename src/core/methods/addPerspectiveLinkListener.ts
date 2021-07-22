// import { useQuery } from "@vue/apollo-composable";
// import { useRoute, useRouter } from "vue-router";
// import { gql } from "@apollo/client/core";
// import { defineComponent, watch, computed } from "vue";
// import { useStore } from "vuex";
// import { onError } from "@apollo/client/link/error";
// import { logErrorMessages } from "@vue/apollo-util";
// import { expressionGetDelayMs, expressionGetRetries } from "@/core/juntoTypes";
// import { LinkExpression } from "@perspect3vism/ad4m-executor";
// import { AGENT_STATUS, GET_EXPRESSION } from "@/core/graphql_queries";
// import { CommunityState, ModalsState, ToastState } from "@/store/types";
// import showMessageNotification from "@/utils/showMessageNotification";
// import { print } from "graphql/language/printer";
// import { AgentStatus } from "@perspect3vism/ad4m-types";
// import { apolloClient } from "./app";

// //Watch for incoming signals from holochain - an incoming signal should mean a DM is inbound
// const newLinkHandler = async (link: LinkExpression, perspective: string) => {
//   console.log("GOT INCOMING MESSAGE SIGNAL", link, perspective);
//   if (link.data!.predicate! == "sioc://content_of") {
//     //Start expression web worker to try and get the expression data pointed to in link target
//     const expressionWorker = new Worker("pollingWorker.js");

//     expressionWorker.postMessage({
//       retry: expressionGetRetries,
//       interval: expressionGetDelayMs,
//       query: print(GET_EXPRESSION),
//       variables: { url: link.data!.target! },
//       name: "Expression signal get",
//     });

//     expressionWorker.onerror = function (e) {
//       throw new Error(e.toString());
//     };

//     expressionWorker.addEventListener("message", (e) => {
//       const expression = e.data.expression;
//       if (expression) {
//         //Expression is not null, which means we got the data and we can terminate the loop
//         expressionWorker.terminate();
//         const message = JSON.parse(expression!.data!);

//         console.log("FOUND EXPRESSION FOR SIGNAL");
//         //Add the expression to the store
//         store.commit("addExpressionAndLinkFromLanguageAddress", {
//           linkLanguage: perspective,
//           link: link,
//           message: expression,
//         });

//         showMessageNotification(
//           router,
//           route,
//           store,
//           perspective,
//           expression!.author,
//           message.body
//         );

//         //Add UI notification on the channel to notify that there is a new message there
//         store.commit("setHasNewMessages", {
//           channelId:
//             store.getters.getChannelFromLinkLanguage(perspective).perspective,
//           value: true,
//         });
//       }
//     });
//   }
// };

// const communities: CommunityState[] = Object.values(
//   store.getters.getCommunities
// );
// for (const community of communities) {
//   for (const channel of Object.values(community.channels)) {
//     apolloClient
//       .subscribe({
//         query: gql` subscription {
//                   perspectiveLinkAdded(uuid: "${channel.perspective.uuid}") {
//                     author
//                     timestamp
//                     data { source, predicate, target }
//                     proof { valid, invalid, signature, key }
//                   }
//               }
//           `,
//       })
//       .subscribe({
//         next: (result) => {
//           console.debug(
//             "Got new link with data",
//             result.data,
//             "and channel",
//             channel
//           );
//           newLinkHandler(
//             result.data.perspectiveLinkAdded,
//             channel.perspective.uuid
//           );
//         },
//         error: (e) => {
//           throw Error(e);
//         },
//       });
//   }
// }
