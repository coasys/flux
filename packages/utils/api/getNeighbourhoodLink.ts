import retry from "../helpers/retry";
import { LinkQuery, Literal } from "@perspect3vism/ad4m";
import { findLink, mapLiteralLinks } from "../helpers/linkHelpers";
import {
  CARD_HIDDEN,
  DESCRIPTION,
  NAME,
} from "../constants/communityPredicates";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/utils";
import { cacheLinks, getCacheLinks } from "../helpers/cacheLinks";

export interface Payload {
  perspectiveUuid: string;
  messageUrl: string;
  message: Object;
  isHidden: boolean;
}

function isValidUrl(urlString) {
  var urlPattern = new RegExp(
    "^(https?:\\/\\/)?" + // validate protocol
      "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" + // validate domain name
      "((\\d{1,3}\\.){3}\\d{1,3}))" + // validate OR ip (v4) address
      "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + // validate port and path
      "(\\?[;&a-z\\d%_.~+=-]*)?" + // validate query string
      "(\\#[-a-z\\d_]*)?$",
    "i"
  ); // validate fragment locator
  return !!urlPattern.test(urlString);
}

export function findNeighbourhood(str: string) {
  const URIregexp = /<span data-mention="neighbourhood"[^>]*>([^<]*)<\/span>/g;
  const URLregexp = /<a[^>]+href=\"(.*?)\"[^>]*>(.*)?<\/a>/gm;
  const uritokens = Array.from(str.matchAll(URIregexp));
  const urlTokens = Array.from(str.matchAll(URLregexp));

  const urifiltered = [];
  const urlfiltered = [];

  for (const match of uritokens) {
    if (!isValidUrl(match[1])) {
      urifiltered.push(match[1]);
    }
  }

  for (const match of urlTokens) {
    if (isValidUrl(match[1])) {
      urlfiltered.push(match[1]);
    }
  }

  return [urifiltered, urlfiltered];
}

export default async function ({ message, isHidden }: Payload) {
  try {
    const client = await getAd4mClient();

    // @ts-ignore
    const [neighbourhoods, urls] = findNeighbourhood(message);

    const hoods = [];

    if (!isHidden) {
      for (const neighbourhood of neighbourhoods) {
        const exp = await client.expression.get(neighbourhood);
        const links = JSON.parse(exp.data).meta.links;

        const perspectives = await client.perspective.all();
        const perspectiveUuid = perspectives.find(
          (e) => e.sharedUrl === neighbourhood
        )?.uuid;

        const { name, description } = mapLiteralLinks(links, {
          name: NAME,
          description: DESCRIPTION,
        });

        hoods.push({
          type: "neighbourhood",
          name,
          description,
          url: neighbourhood || "",
          perspectiveUuid,
        });
      }

      for (const url of urls) {
        let data = await getCacheLinks(url);

        if (!data) {
          data = await fetch("https://jsonlink.io/api/extract?url=" + url).then(
            (res) => res.json()
          );

          cacheLinks(url, data);
        }

        if (data.title) {
          hoods.push({
            type: "link",
            name: data.title || "",
            description: data.description || "",
            image: data.images[0] || "",
            url,
          });
        }
      }
    }

    return hoods;
  } catch (e: any) {
    throw new Error(e);
  }
}

export async function getNeighbourhoodCardHidden({
  perspectiveUuid,
  messageUrl,
}) {
  try {
    const client = await getAd4mClient();

    const isHidden = await retry(
      async () => {
        return await client.perspective.queryLinks(
          perspectiveUuid,
          new LinkQuery({
            source: messageUrl,
            predicate: CARD_HIDDEN,
          })
        );
      },
      { defaultValue: [] }
    );

    return isHidden.length === 0;
  } catch (e: any) {
    throw new Error(e);
  }
}
