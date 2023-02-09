import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";
import { createLiteralObject } from "../helpers";
import {
  AREA_WEBLINK,
  OG_DESCRIPTION,
  OG_IMAGE,
  OG_LINK,
  OG_TITLE,
} from "../constants";
import { WebLink } from "../types";

export default async function createAgentWebLink(payload: {
  title: string;
  url: string;
  description: string;
  imageUrl: string;
}): Promise<WebLink> {
  const client = await getAd4mClient();

  const links = await createLiteralObject({
    parent: {
      source: `self`,
      predicate: AREA_WEBLINK,
      target: payload.url || "",
    },
    children: {
      [OG_TITLE]: payload.title || "",
      [OG_LINK]: payload.url || "",
      [OG_DESCRIPTION]: payload.description || "",
      [OG_IMAGE]: payload.imageUrl || "",
    },
  });

  await client.agent.mutatePublicPerspective({
    additions: links,
    removals: [],
  });

  return {
    id: payload.url,
    title: payload.title,
    description: payload.description,
    url: payload.url,
    image: payload.imageUrl,
  };
}
