import { gql } from "@apollo/client/core";

export const OPEN_LINK = gql`
  mutation runtimeOpenLink($url: String!) {
    runtimeOpenLink(url: $url)
  }
`;

export const QUIT = gql`
  mutation runtimeQuit {
    runtimeQuit
  }
`;

export const AGENT_STATUS = gql`
  query agentStatus {
    agentStatus {
      isInitialized
      isUnlocked
      did
      didDocument
    }
  }
`;

export const AGENT = gql`
  query agent {
    agent {
      did
    }
  }
`;

export const AGENT_GENERATE = gql`
  mutation agentGenerate($passphrase: String!) {
    agentGenerate(passphrase: $passphrase) {
      isInitialized
      isUnlocked
      did
      didDocument
    }
  }
`;

export const AGENT_LOCK = gql`
  mutation agentLock($passphrase: String!) {
    agentLock(passphrase: $passphrase) {
      isInitialized
      isUnlocked
      did
    }
  }
`;

export const AGENT_UNLOCK = gql`
  mutation agentUnlock($passphrase: String!) {
    agentUnlock(passphrase: $passphrase) {
      isInitialized
      isUnlocked
      did
      error
    }
  }
`;

export const AGENT_UPDATE_PUBLIC_PERSPECTIVE = gql`
  mutation agentUpdatePublicPerspective($perspective: PerspectiveInput!) {
    agentUpdatePublicPerspective(perspective: $perspective) {
      did
      directMessageLanguage
      perspective {
        links {
          author
          timestamp
          proof {
            signature
            key
            valid
            invalid
          }
          data {
            source
            predicate
            target
          }
        }
      }
    }
  }
`;

export const AGENT_UPDATE_DIRECT_MESSAGE_ADAPTER = gql`
  mutation agentUpdateDirectMessageLanguage($directMessageLanguage: String!) {
    agentUpdateDirectMessageLanguage(
      directMessageLanguage: $directMessageLanguage
    ) {
      did
      directMessageLanguage
      perspective {
        links {
          author
          timestamp
          proof {
            signature
            key
            valid
            invalid
          }
          data {
            source
            predicate
            target
          }
        }
      }
    }
  }
`;

export const LANGUAGES_WRITE_SETTINGS = gql`
  mutation languageWriteSettings(
    $languageAddress: String!
    $settings: String!
  ) {
    languageWriteSettings(
      languageAddress: $languageAddress
      settings: $settings
    )
  }
`;

export const PERSPECTIVE = gql`
  query perspective($uuid: String!) {
    perspective(uuid: $uuid) {
      uuid
      name
      sharedUrl
    }
  }
`;

export const PERSPECTIVES = gql`
  query perspectives {
    perspectives {
      name
      uuid
      sharedUrl
    }
  }
`;

export const PERSPECTIVE_SNAPSHOT = gql`
  query perspectiveSnapshot($uuid: String!) {
    perspectiveSnapshot(uuid: $uuid) {
      links {
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
  }
`;

export const PERSPECTIVE_ADD = gql`
  mutation perspectiveAdd($name: String!) {
    perspectiveAdd(name: $name) {
      uuid
      name
      sharedUrl
    }
  }
`;

export const PERSPECTIVE_UPDATE = gql`
  mutation perspectiveUpdate($uuid: String!, $name: String!) {
    perspectiveUpdate(uuid: $uuid, name: $name) {
      uuid
      name
      sharedUrl
    }
  }
`;

export const PUBLISH_NEIGHBOURHOOD_FROM_PERSPECTIVE = gql`
  mutation neighbourhoodPublishFromPerspective(
    $linkLanguage: String!
    $meta: PerspectiveInput!
    $perspectiveUUID: String!
  ) {
    neighbourhoodPublishFromPerspective(
      linkLanguage: $linkLanguage
      meta: $meta
      perspectiveUUID: $perspectiveUUID
    )
  }
`;

export const PERSPECTIVE_REMOVE = gql`
  mutation perspectiveRemove($uuid: String!) {
    perspectiveRemove(uuid: $uuid)
  }
`;

export const PERSPECTIVE_ADDED = gql`
  subscription {
    perspectiveAdded {
      uuid
      name
      sharedUrl
    }
  }
`;

export const PERSPECTIVE_UPDATED = gql`
  subscription {
    perspectiveUpdated {
      uuid
      name
      sharedUrl
    }
  }
`;

export const PERSPECTIVE_REMOVED = gql`
  subscription {
    perspectiveRemoved
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

export const ADD_LINK = gql`
  mutation perspectiveAddLink($uuid: String!, $link: LinkInput!) {
    perspectiveAddLink(uuid: $uuid, link: $link) {
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

export const CREATE_EXPRESSION = gql`
  mutation expressionCreate($content: String!, $languageAddress: String!) {
    expressionCreate(languageAddress: $languageAddress, content: $content)
  }
`;

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

export const LANGUAGE = gql`
  query language($address: String!) {
    language(address: $address) {
      name
      address
      settings
      icon {
        code
      }
      constructorIcon {
        code
      }
      settingsIcon {
        code
      }
    }
  }
`;

export const LANGUAGES = gql`
  query languages($filter: String!) {
    languages(filter: $filter) {
      name
      address
      settings
      icon {
        code
      }
      constructorIcon {
        code
      }
      settingsIcon {
        code
      }
    }
  }
`;

export const NEIGHBOURHOOD_JOIN = gql`
  mutation neighbourhoodJoinFromUrl($url: String!) {
    neighbourhoodJoinFromUrl(url: $url) {
      uuid
      name
      sharedUrl
      neighbourhood {
        linkLanguage
        meta {
          links {
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
      }
    }
  }
`;

export const ADD_TRUSTED_AGENTS = gql`
  mutation addTrustedAgents($agents: [String!]!) {
    addTrustedAgents(agents: $agents)
  }
`;

export const DELETE_TRUSTED_AGENTS = gql`
  mutation deleteTrustedAgents($agents: [String!]!) {
    deleteTrustedAgents(agents: $agents)
  }
`;

export const GET_TRUSTED_AGENTS = gql`
  query getTrustedAgents {
    getTrustedAgents
  }
`;

export const LANGUAGE_APPLY_TEMPLATE_AND_PUBLISH = gql`
  mutation languageApplyTemplateAndPublish(
    $sourceLanguageHash: String!
    $templateData: String!
  ) {
    languageApplyTemplateAndPublish(
      sourceLanguageHash: $sourceLanguageHash
      templateData: $templateData
    ) {
      name
      address
    }
  }
`;
