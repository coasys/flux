import { LinkExpression, Literal } from "@perspect3vism/ad4m";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";
import { CHANNEL, CHANNEL_VIEW, SELF } from "../constants/communityPredicates";
import { channelQuery, DEFAULT_LIMIT } from "../constants/sdna";
import { Channel, Entry } from "../types";
import getEntries from "./getEntries";

export interface Payload {
  perspectiveUuid: string;
}

function getContent(acc, link: any) {
  return acc?.timestamp > link?.timestamp
    ? acc
    : link.content.startsWith("literal://")
    ? Literal.fromUrl(link.content).get()
    : link;
}

function cleanChannelData(perspectiveUuid: string, entry: Entry): Channel {
  const data = entry.data;

  return {
    id: entry.id.replace("flux_entry://", ""),
    perspectiveUuid,
    name: data?.Name?.reduce(getContent, null)?.data,
    description: "",
    timestamp: entry.timestamp,
    author: entry.author,
    views: data?.Views?.map((d) => d.content),
  };
}

export default async function ({ perspectiveUuid }: Payload) {
  return getEntries({
    perspectiveUuid,
    queries: [
      {
        query: channelQuery,
        variables: {
          limit: DEFAULT_LIMIT,
          source: SELF,
        },
        resultKeys: ["Id", "Timestamp", "Author", "Name", "Views"],
      },
    ],
  }).then((entries) =>
    entries.map((entry) => cleanChannelData(perspectiveUuid, entry))
  );
}
