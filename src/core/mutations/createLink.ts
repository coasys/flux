import { apolloClient, ad4mClient } from "@/app";
import { ADD_LINK } from "../graphql_queries";
import { Link, LinkExpression } from "@perspect3vism/ad4m";

export function createLink(
  perspective: string,
  link: Link
): Promise<LinkExpression> {
  return ad4mClient.perspective.addLink(perspective, link)
}
