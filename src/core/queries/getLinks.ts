import { ad4mClient } from "@/app";
import { LinkQuery, LinkExpression } from "@perspect3vism/ad4m";

export function getLinks(
  perspective: string,
  linkQuery: LinkQuery
): Promise<LinkExpression[]> {
  return ad4mClient.perspective.queryLinks(perspective, linkQuery)
}

export function getChatChannelLinks(
  perspectiveUUID: string,
  linkLanguageAddress: string
): Promise<LinkExpression[]> {
  return getLinks(
    perspectiveUUID,
    new LinkQuery({source: `${linkLanguageAddress}://self`, predicate: "sioc://has_space"})
  );
}

export function getGroupExpressionLinks(
  perspectiveUUID: string,
  linkLanguageAddress: string
): Promise<LinkExpression[]> {
  return getLinks(
    perspectiveUUID,
    new LinkQuery({source: `${linkLanguageAddress}://self`, predicate: "rdf://class"})
  );
}