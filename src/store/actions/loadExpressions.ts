import { Commit } from "vuex";
import hash from "object-hash";
import type Expression from "@perspect3vism/ad4m/Expression";
import { getLinksPaginated } from "@/core/queries/getLinks";
import { State, LinkExpressionAndLang, ExpressionAndRef } from "..";
import { getExpressionAndRetry } from "@/core/queries/getExpression";
import { parseExprURL } from "@perspect3vism/ad4m/ExpressionRef";

export interface Context {
  commit: Commit;
  getters: any;
  state: State;
}

export interface Payload {
  communityId: string;
  channelId: string;
  from: Date;
  to: Date;
}

export default async function (
  { getters, commit, state }: Context,
  { channelId, communityId, from, to }: Payload
): Promise<boolean> {
  try {
    const fromDate = from || getters.getApplicationStartTime;
    const untilDate = to || new Date("August 19, 1975 23:15:30").toISOString();
    const community = state.communities[communityId];
    const channel = community?.channels[channelId];
    const links: { [x: string]: LinkExpressionAndLang } = {};
    const expressions: { [x: string]: ExpressionAndRef } = {};
    let latestLinkTimestamp: Date | null = null;

    const linkQuery = await getLinksPaginated(
      channelId.toString(),
      "sioc://chatchannel",
      "sioc://content_of",
      fromDate,
      untilDate
    );
    if (linkQuery) {
      if (channel) {
        for (const link of linkQuery) {
          const currentExpressionLink =
            channel.currentExpressionLinks[hash(link.data!)];

          if (!currentExpressionLink) {
            const expression = await getExpressionAndRetry(
              //@ts-ignore
              link.data.target,
              50,
              20
            );
            if (expression) {
              links[hash(link.data!)] = {
                expression: link,
                language: channel.linkLanguageAddress,
              } as LinkExpressionAndLang;
              expressions[expression.url!] = {
                expression: {
                  author: expression.author!,
                  data: JSON.parse(expression.data!),
                  timestamp: expression.timestamp!,
                  proof: expression.proof!,
                } as Expression,
                //@ts-ignore
                url: parseExprURL(link.data.target),
              } as ExpressionAndRef;
              latestLinkTimestamp = new Date(link.timestamp!);
            }
          }
        }

        commit("addMessages", {
          channelId: channelId,
          communityId: communityId,
          expressions: expressions,
          links: links,
        });

        if (latestLinkTimestamp) {
          if (
            Object.values(channel.currentExpressionLinks).filter(
              (link) =>
                new Date(link.expression.timestamp!) > latestLinkTimestamp!
            ).length > 0
          ) {
            return false;
          } else {
            return true;
          }
        }
      }
    }
    return false;
  } catch (e) {
    commit("showDangerToast", {
      message: e.message,
    });
    throw new Error(e);
  }
}
