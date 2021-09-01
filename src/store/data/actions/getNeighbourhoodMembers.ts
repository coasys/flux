import { print } from "graphql/language/printer";
import { LinkQuery } from "@perspect3vism/ad4m";
import { TimeoutCache } from "../../../utils/timeoutCache";

import { ExpressionTypes, ProfileExpression } from "@/store/types";
import { useDataStore } from "..";
import { useAppStore } from "@/store/app";

import { MEMBER } from "@/constants/neighbourhoodMeta";
import { GET_EXPRESSION, PERSPECTIVE_LINK_QUERY } from "@/core/graphql_queries";

const expressionWorker = new Worker("pollingWorker.js");

export default async function (id: string): Promise<Worker> {
  const dataStore = useDataStore();
  const appStore = useAppStore();

  const cache = new TimeoutCache<ProfileExpression>(1000 * 60 * 5);

  try {
    const neighbourhood = dataStore.getNeighbourhood(id);

    const profileLang = neighbourhood?.typedExpressionLanguages.find(
      (t: any) => t.expressionType === ExpressionTypes.ProfileExpression
    );

    if (profileLang) {
      const profileLinksWorker = new Worker("pollingWorker.js");

      profileLinksWorker.postMessage({
        interval: 5000,
        query: print(PERSPECTIVE_LINK_QUERY),
        variables: {
          uuid: id,
          query: new LinkQuery({
            source: `${neighbourhood.neighbourhoodUrl!}://self`,
            predicate: MEMBER,
          })
        },
        name: `Community members for ${neighbourhood.perspective.name}`,
        dataKey: `perspectiveQueryLinks`
      });
  
      profileLinksWorker.onerror = function(e) {
        throw new Error(e.toString());
      }
  
      profileLinksWorker.addEventListener("message", async (e) => {
        const profileLinks = e.data.perspectiveQueryLinks;

        for (const profileLink of profileLinks) {
          const profile = cache.get(profileLink.data.target);

          if (profile) {
            dataStore.setNeighbourhoodMember({
              perspectiveUuid: id,
              member: profile,
            });
          } else {          
            expressionWorker.postMessage({
              retry: 50,
              interval: 5000,
              query: print(GET_EXPRESSION),
              variables: { url: profileLink.data.target },
              callbackData: { link: profileLink },
              name: `Get community member expression data from link ${neighbourhood.perspective.name}`,
              dataKey: "expression",
            });
          }
        }
      });
  
      expressionWorker.onerror = function (e) {
        throw new Error(e.toString());
      };
  
      expressionWorker.addEventListener("message", (e: any) => {
        const profileGqlExp = e.data.expression;
        const link = e.data.callbackData.link;
        const did = `${profileLang!.languageAddress}://${link.author}`;

        const profileExp = {
          author: profileGqlExp.author!,
          data: JSON.parse(profileGqlExp.data!),
          timestamp: profileGqlExp.timestamp!,
          proof: profileGqlExp.proof!,
        } as ProfileExpression;

        if (profileGqlExp) {
          dataStore.setNeighbourhoodMember({
            perspectiveUuid: id,
            member: profileExp,
          });
    
          cache.set(did, profileExp);
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
