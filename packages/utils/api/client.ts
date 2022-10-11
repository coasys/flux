import { Ad4mClient } from "@perspect3vism/ad4m";
import {
  ApolloClient,
  InMemoryCache,
} from "@apollo/client";
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';

export function buildAd4mClient() {
  const wsLink = new GraphQLWsLink(
    createClient({
        url: localStorage.getItem('ad4minURL')!,
        connectionParams: () => {
            return {
                headers: {
                    authorization: localStorage.getItem("ad4minToken") || ""
                }
            }
        },
    }));

  const apolloClient = new ApolloClient({
    link: wsLink,
    cache: new InMemoryCache({ resultCaching: false, addTypename: false }),
    defaultOptions: {
      watchQuery: { fetchPolicy: "no-cache" },
      query: { fetchPolicy: "no-cache" },
    },
  });

  return new Ad4mClient(apolloClient);    
}

const ad4mClient = buildAd4mClient();

export default ad4mClient;