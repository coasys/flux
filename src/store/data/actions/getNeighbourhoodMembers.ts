import { print } from "graphql/language/printer";
import { LinkQuery } from "@perspect3vism/ad4m";

import { ExpressionTypes, ProfileExpression } from "@/store/types";
import { useDataStore } from "..";
import { useAppStore } from "@/store/app";

import { MEMBER } from "@/constants/neighbourhoodMeta";
import { memberRefreshDurationMs } from "@/constants/config";
import { GET_EXPRESSION, PERSPECTIVE_LINK_QUERY } from "@/core/graphql_queries";
import { profileCache } from "@/app";

const expressionWorker = new Worker("pollingWorker.js");

const PORT = parseInt(global.location.search.slice(6))

export default async function (id: string): Promise<Worker> {
  const dataStore = useDataStore();
  const appStore = useAppStore();

  try {
    const neighbourhood = dataStore.getNeighbourhood(id);

    const profileLang = neighbourhood?.typedExpressionLanguages.find(
      (t: any) => t.expressionType === ExpressionTypes.ProfileExpression
    );

    if (profileLang) {
      const profileLinksWorker = new Worker("pollingWorker.js");

      profileLinksWorker.postMessage({
        interval: memberRefreshDurationMs,
        staticSleep: true,
        query: print(PERSPECTIVE_LINK_QUERY),
        variables: {
          uuid: id,
          query: new LinkQuery({
            source: neighbourhood.neighbourhoodUrl!,
            predicate: MEMBER,
          }),
        },
        name: `Community members for ${neighbourhood.perspective.name}`,
        dataKey: `perspectiveQueryLinks`,
        port: PORT
      });

      profileLinksWorker.onerror = function (e) {
        throw new Error(e.toString());
      };

      profileLinksWorker.addEventListener("message", async (e) => {
        const profileLinks = e.data.perspectiveQueryLinks;

        for (const profileLink of profileLinks) {
          const profile = await profileCache.get(profileLink.data.target);

          if (profile) {
            dataStore.setNeighbourhoodMember({
              perspectiveUuid: id,
              member: profile.author,
            });
          } else {
            expressionWorker.postMessage({
              id: profileLink.data.target,
              retry: 50,
              interval: 5000,
              query: print(GET_EXPRESSION),
              variables: { url: profileLink.data.target },
              callbackData: { link: profileLink },
              name: `Get community member expression data from link ${neighbourhood.perspective.name}`,
              dataKey: "expression",
              port: PORT
            });
          }
        }
      });

      expressionWorker.onerror = function (e) {
        throw new Error(e.toString());
      };

      expressionWorker.addEventListener("message", async (e: any) => {
        const profileGqlExp = e.data.expression;
        const link = e.data.callbackData.link;
        const profileRef = `${profileLang!.languageAddress}://${link.author}`;

        const profileExp = {
          author: profileGqlExp.author!,
          data: JSON.parse(profileGqlExp.data!),
          timestamp: profileGqlExp.timestamp!,
          proof: profileGqlExp.proof!,
        } as ProfileExpression;

        if (profileGqlExp) {
          dataStore.setNeighbourhoodMember({
            perspectiveUuid: id,
            member: profileExp.author,
          });

          await profileCache.set(profileRef, profileExp);
        }
      });

      return profileLinksWorker;
    } else {
      const errorMessage =
        "Expected to find profile expression language for this community";
      appStore.showDangerToast({
        message: errorMessage,
      });
      throw Error(errorMessage);
    }
  } catch (e) {
    appStore.showDangerToast({
      message: e.message,
    });
    throw new Error(e);
  }
}
