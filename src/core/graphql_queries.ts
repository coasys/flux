import { gql } from "@apollo/client/core";

export const GET_EXPRESSION = gql`
  query expression($url: String!) {
    expression(url: $url) {
      author
      timestamp
      data
      language {
        address
      }
      proof {
        valid
        invalid
        signature
      }
    }
  }
`;

export const PERSPECTIVE_LINK_QUERY = gql`
  query perspectiveQueryLinks($uuid: String!, $query: LinkQuery!) {
    perspectiveQueryLinks(query: $query, uuid: $uuid) {
      author
      timestamp
      data {
        source
        predicate
        target
      }
      proof {
        valid
        invalid
        signature
        key
      }
    }
  }
`;

export const GET_MANY_EXPRESSION = gql`
  query expressionMany($urls: [String!]!) {
    expressionMany(urls: $urls) {
      author
      timestamp
      data
      language {
        address
        name
      }
      proof {
        valid
        invalid
        signature
      }
    }
  }
`;
