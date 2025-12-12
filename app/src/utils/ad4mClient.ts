import { ApolloClient, InMemoryCache } from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { Ad4mClient } from '@coasys/ad4m';
import { createClient } from 'graphql-ws';

export function buildAd4mClientFromConfig(port: number, token: string): Ad4mClient {
  // Set up Apollo Client with GraphQL WS link
  const server = `ws://localhost:${port}/graphql`;
  const clientParams = { 
    url: server, 
    connectionParams: { headers: { authorization: token } } 
  };
  const link = new GraphQLWsLink(createClient(clientParams));
  const cache = new InMemoryCache({ resultCaching: false });
  const defaultOptions = {
    watchQuery: { fetchPolicy: 'no-cache' as const },
    query: { fetchPolicy: 'no-cache' as const },
  };
  const apolloClient = new ApolloClient({ link, cache, defaultOptions });

  // Build and return the Ad4m client (cast to any to handle version mismatches)
  return new Ad4mClient(apolloClient as any, true);
}
