import hash from "object-hash";
import { print } from "graphql/language/printer";
import { GET_EXPRESSION, PERSPECTIVE_LINK_QUERY } from "@/core/graphql_queries";
import { LinkQuery } from "@perspect3vism/ad4m";
import { useDataStore } from "..";
import { useAppStore } from "@/store/app";


export interface Payload {
  channelId: string;
  from?: Date;
  to?: Date;
}

export interface LoadExpressionResult {
  linksWorker: Worker;
}

const expressionWorker = new Worker("pollingWorker.js");

/// Function that polls for new messages on a channel using a web worker, if a message link is found then another web worker is spawned to retry getting the expression until its found
export default async function (
  { channelId, from, to }: Payload
): Promise<LoadExpressionResult> {
  const dataStore = useDataStore();
  const appStore = useAppStore();

  try {
    const fromDate = from || appStore.getApplicationStartTime;
    const untilDate = to || new Date("August 19, 1975 23:15:30").toISOString();

    const channel = dataStore.getNeighbourhood(channelId);

    if (!channel) {
      console.error(`No channel with id ${channelId} found`);
    }

    const linksWorker = new Worker("pollingWorker.js");

    linksWorker.postMessage({
      interval: 10000,
      query: print(PERSPECTIVE_LINK_QUERY),
      variables: {
        uuid: channelId.toString(),
        query: {
          source: "sioc://chatchannel",
          predicate: "sioc://content_of",
          fromDate,
          untilDate,
        } as LinkQuery,
      },
      name: `Get channel expressioLinks ${channel.name}`,
      dataKey: "perspectiveQueryLinks",
      quitOnResponse: false,
    });

    //If links worker gets an error then throw it
    linksWorker.onerror = function (e) {
      throw new Error(e.toString());
    };

    //Listen for message callback saying we got some links
    linksWorker.addEventListener("message", (e) => {
      const linkQuery = e.data.perspectiveQueryLinks;

      for (const link of linkQuery) {
        //Hash the link data as the key for map and check if it exists in the store
        const currentExpressionLink =
          channel.currentExpressionLinks[
            hash(link.data!, { excludeValues: "__typename" })
          ];
        const currentExpression =
          channel.currentExpressionMessages[link.data.target];

        if (!currentExpressionLink || !currentExpression) {
          //Run expression worker to try and get expression on link target
          expressionWorker.postMessage({
            retry: 50,
            interval: 5000,
            query: print(GET_EXPRESSION),
            variables: { url: link.data.target },
            callbackData: { link },
            name: `Get expression data from channel links ${channel.name}`,
            dataKey: "expression",
          });
        }
      }
    });

    expressionWorker.onerror = function (e) {
      throw new Error(e.toString());
    };

    expressionWorker.addEventListener("message", (e: any) => {
      const expression = e.data.expression;
      const link = e.data.callbackData.link;

      //Add the link and message to the store
      dataStore.addMessage({
        channelId,
        link: link,
        expression: expression,
      });
    });

    return { linksWorker };
  } catch (e) {
    appStore.showDangerToast({
      message: e.message,
    });
    throw new Error(e);
  }
}
