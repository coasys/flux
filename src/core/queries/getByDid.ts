import { apolloClient } from "@/app";

import unwrapApolloResult from "@/utils/unwrapApolloResult";
import { Agent, LanguageHandle, Perspective } from "@perspect3vism/ad4m";
import {
  AGENT_PERSPECTIVE_BY_DID,
  LANGUAGE,
  SNAPSHOT_BY_UUID,
} from "../graphql_queries";

export default async function getByDid(uuid: string): Promise<Agent | null> {
  const { agentByDID } = unwrapApolloResult(
    await apolloClient.query({
      query: AGENT_PERSPECTIVE_BY_DID,
      variables: { did: uuid },
      fetchPolicy: "no-cache",
    })
  );
  return agentByDID;
}
