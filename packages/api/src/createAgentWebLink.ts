import { getAd4mClient } from "@coasys/ad4m-connect";
import { createLiteralObject } from "@coasys/flux-utils";
import { profile } from "@coasys/flux-constants";
import { WebLink } from "@coasys/flux-types";

const { AREA_WEBLINK, OG_DESCRIPTION, OG_IMAGE, OG_LINK, OG_TITLE } = profile;

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
