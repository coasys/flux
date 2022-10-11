import { LinkExpression, Literal } from "@perspect3vism/ad4m";
import { CHANNEL, SELF } from "../constants/ad4m";
import ad4mClient from "./client";

export interface Payload {
  perspectiveUuid: string;
  neighbourhoodUrl: string;
}

export default async function ({ perspectiveUuid, neighbourhoodUrl }: Payload) {
  try {
    const expressionLinks = await ad4mClient.perspective.queryProlog(perspectiveUuid, `link("${SELF}", "${CHANNEL}", C, T, A).`);
    const channels: {[x: string]: any} = {}

    if (expressionLinks) {
      for (const channel of expressionLinks as LinkExpression[]) {
        const literal = Literal.fromUrl(channel.C).get();
        channels[literal.data] = {
          id: literal.data,
          name: literal.data,
          creatorDid: channel.A,
        }
      }
    }

    return channels;
  } catch (e) {
    throw new Error(e);
  }
}
