import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";
import { SELF, ZOME } from "../constants/communityPredicates";
import { LinkQuery, Literal, LinkExpression } from "@perspect3vism/ad4m";
import { SDNAValues } from "./generateSDNALiteral";

export async function getSDNALinkLiteral(perspectiveUuid: string): Promise<string | null> {
    const existingSDNALinks = await getSDNALinks(perspectiveUuid);
    if (existingSDNALinks.length > 0) {
        return Literal.fromUrl(existingSDNALinks[0].data.target).get();
    }
    return null;
}

export async function getSDNALinks(perspectiveUuid: string): Promise<LinkExpression[]> {
    const ad4mClient = await getAd4mClient();
    const existingSDNALinks = await ad4mClient.perspective.queryLinks(perspectiveUuid, {source: SELF, predicate: ZOME} as LinkQuery);
    return existingSDNALinks;
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