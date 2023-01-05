import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";
import { SELF, ZOME, SDNA_VERSION, CREATED_AT } from "../constants/communityPredicates";
import { LinkQuery, Literal, LinkExpression } from "@perspect3vism/ad4m";
import { SDNAValues } from "./generateSDNALiteral";
import { SdnaVersion } from "../types";

export async function getSDNALinkLiteral(perspectiveUuid: string): Promise<string | null> {
    const existingSDNALinks = await getSDNALinks(perspectiveUuid);
    if (existingSDNALinks.length > 0) {
        return Literal.fromUrl(existingSDNALinks[0].data.target).get();
    }
    return null;
}

export async function getSDNAVersion(perspectiveUuid): Promise<SdnaVersion | null> {
    const ad4mClient = await getAd4mClient();
    const existingSDNALinks = await getSDNALinks(perspectiveUuid);
    if (existingSDNALinks.length > 0) {
        const sdnaLinkVersion = await ad4mClient.perspective.queryLinks(perspectiveUuid, {source: existingSDNALinks[0].data.target, predicate: SDNA_VERSION} as LinkQuery);
        sdnaLinkVersion.sort((linka, linkb) => linka.timestamp > linkb.timestamp ? -1 : 1);
        if (sdnaLinkVersion.length > 0) {
            const sdnaCreatedAt = await ad4mClient.perspective.queryLinks(perspectiveUuid, {source: existingSDNALinks[0].data.target, predicate: CREATED_AT} as LinkQuery);
            sdnaCreatedAt.sort((linka, linkb) => linka.timestamp > linkb.timestamp ? -1 : 1);
            if (sdnaCreatedAt.length > 0) {
                return {
                    version: parseInt(sdnaLinkVersion[0].data.target.replace("int://", "")),
                    timestamp: new Date(sdnaCreatedAt[0].data.target)
                }
            } else {
                console.warn("getSDNAVersion: No SDNA creation date found");
                return null;
            }
        } else {
            console.warn("getSDNAVersion: No SDNA version found");
            return null;
        }
    } else {
        console.warn("getSDNAVersion: No SDNA link found");
        return null;
    }
}

export async function getSDNALinks(perspectiveUuid: string): Promise<LinkExpression[]> {
    const ad4mClient = await getAd4mClient();
    const existingSDNALinks = await ad4mClient.perspective.queryLinks(perspectiveUuid, {source: SELF, predicate: ZOME} as LinkQuery);
    return existingSDNALinks;
}

export async function getFluxSDNALinks(perspectiveUuid: string) {
  const existingSDNALinks = await getSDNALinks(perspectiveUuid);
  const fluxSDNALinks = existingSDNALinks.filter((link) => link.data.target.includes("flux_message") || link.data.target.includes("flux_post"));
  return fluxSDNALinks;
}


export async function getSDNAValues(perspectiveUuid: string): Promise<SDNAValues| null> {
    const existingSDNA = await getSDNALinkLiteral(perspectiveUuid);

    if (!existingSDNA) {
        return null;
    }

    const emojiRegex = new RegExp('emoji:\/\/[A-Za-z0-9]+');
    const emojiCountRegex = new RegExp('[a-zA-Z]+ >= ([0-9])');
    const emoji = existingSDNA.match(emojiRegex)![0].replace("emoji://", "");
    const emojiString = String.fromCodePoint(parseInt(`0x${emoji}`));
    const emojiCount = parseInt(existingSDNA.match(emojiCountRegex)![1]);
    return {emoji: emojiString, emojiCount}
}