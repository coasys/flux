import { gql } from "@apollo/client/core";

export const OPEN_LINK = gql`
  mutation openLinkExtern($url: String) {
    openLinkExtern(url: $url)
  }
`;

export const QUIT = gql`
  mutation quit {
    quit
  }
`;

export const AGENT_SERVICE_STATUS = gql`
  query agent {
    agent {
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
      agent {
        did
      }
    }
  }
`;

export const INITIALIZE_AGENT = gql`
  mutation initializeAgent(
    $did: String
    $didDocument: String
    $keystore: String
    $passphrase: String
  ) {
    initializeAgent(
      input: {
        did: $did
        didDocument: $didDocument
        keystore: $keystore
        passphrase: $passphrase
      }
    ) {
      isInitialized
      isUnlocked
      did
      didDocument
    }
  }
`;

export const LOCK_AGENT = gql`
  mutation lockAgent($passphrase: String) {
    lockAgent(passphrase: $passphrase) {
      isInitialized
      isUnlocked
      did
    }
  }
`;

export const UNLOCK_AGENT = gql`
  mutation unlockAgent($passphrase: String) {
    unlockAgent(passphrase: $passphrase) {
      isInitialized
      isUnlocked
      did
      error
    }
  }
`;

export const UPDATE_AGENT_PROFILE = gql`
  mutation updateAgentProfile($name: String, $email: String) {
    updateAgentProfile(input: { name: $name, email: $email }) {
      agent {
        did
      }
      isInitialized
      isUnlocked
      did
      error
    }
  }
`;

export const LANGUAGES = gql`
  query languages($filter: String = "") {
    languages(filter: $filter) {
      name
      address
    }
  }
`;

export const LANGUAGES_WITH_SETTINGS = gql`
  query languagesWithSettings($filter: String = "") {
    languages(filter: $filter) {
      name
      address
      settings
      settingsIcon {
        code
      }
    }
  }
`;

export const SET_LANGUAGE_SETTINGS = gql`
  mutation setLanguageSettings($languageAddress: String, $settings: String) {
    setLanguageSettings(
      input: { languageAddress: $languageAddress, settings: $settings }
    )
  }
`;

export const PERSPECTIVES = gql`
  query perspectives {
    perspectives {
      name
      uuid
      sharedPerspective {
        name
        description
        type
        linkLanguages {
          address
          name
        }
        allowedExpressionLanguages
        requiredExpressionLanguages
      }
      sharedURL
    }
  }
`;

export const PERSPECTIVE = gql`
  query perspective($uuid: String) {
    perspective(uuid: $uuid) {
      uuid
      name
      sharedURL
      sharedPerspective {
        name
        description
        type
      }
    }
  }
`;

export const ADD_PERSPECTIVE = gql`
  mutation updatePerspective($name: String) {
    addPerspective(input: { name: $name }) {
      uuid
      name
      sharedURL
      sharedPerspective {
        name
        description
        type
      }
    }
  }
`;

export const UPDATE_PERSPECTIVE = gql`
  mutation updatePerspective(
    $uuid: String
    $name: String
    $linksSharingLanguage: String
  ) {
    updatePerspective(
      input: {
        uuid: $uuid
        name: $name
        linksSharingLanguage: $linksSharingLanguage
      }
    ) {
      uuid
      name
      sharedURL
      sharedPerspective {
        name
        description
        type
      }
    }
  }
`;

export const PUBLISH_PERSPECTIVE = gql`
  mutation publishPerspective(
    $uuid: String
    $name: String
    $description: String
    $type: String
    $uid: String
    $requiredExpressionLanguages: [String]
    $allowedExpressionLanguages: [String]
  ) {
    publishPerspective(
      input: {
        uuid: $uuid
        name: $name
        description: $description
        type: $type
        uid: $uid
        requiredExpressionLanguages: $requiredExpressionLanguages
        allowedExpressionLanguages: $allowedExpressionLanguages
      }
    ) {
      name
      description
      type
      linkLanguages {
        address
        name
      }
      allowedExpressionLanguages
      requiredExpressionLanguages
    }
  }
`;

export const CREATE_UNIQUE_EXPRESSION_LANGUAGE = gql`
  mutation createUniqueHolochainExpressionLanguageFromTemplate(
    $languagePath: String
    $dnaNick: String
    $uid: String
  ) {
    createUniqueHolochainExpressionLanguageFromTemplate(
      input: { languagePath: $languagePath, dnaNick: $dnaNick, uid: $uid }
    ) {
      address
      name
    }
  }
`;

export const REMOVE_PERSPECTIVE = gql`
  mutation removePerspective($uuid: String) {
    removePerspective(uuid: $uuid)
  }
`;

export const PERSPECTIVE_ADDED = gql`
  subscription {
    perspectiveAdded {
      uuid
      name
      sharedURL
      sharedPerspective {
        name
        description
        type
      }
    }
  }
`;

export const PERSPECTIVE_UPDATED = gql`
  subscription {
    perspectiveUpdated {
      uuid
      name
      sharedURL
      sharedPerspective {
        name
        description
        type
      }
    }
  }
`;

export const PERSPECTIVE_REMOVED = gql`
  subscription {
    perspectiveRemoved
  }
`;

export const ALL_LINKS_QUERY = gql`
  query links($perspectiveUUID: String) {
    links(perspectiveUUID: $perspectiveUUID, query: {}) {
      author {
        did
      }
      timestamp
      data {
        source
        predicate
        target
      }
    }
  }
`;

export const SOURCE_LINK_QUERY = gql`
  query links($perspectiveUUID: String, $source: String) {
    links(perspectiveUUID: $perspectiveUUID, query: { source: $source }) {
      author {
        did
      }
      timestamp
      data {
        source
        predicate
        target
      }
    }
  }
`;

export const SOURCE_PREDICATE_LINK_QUERY = gql`
  query links($perspectiveUUID: String, $source: String, $predicate: String) {
    links(
      perspectiveUUID: $perspectiveUUID
      query: { source: $source, predicate: $predicate }
    ) {
      author {
        did
      }
      timestamp
      data {
        source
        predicate
        target
      }
    }
  }
`;

export const SOURCE_LINK_QUERY_TIME_PAGINATED = gql`
  query links(
    $perspectiveUUID: String
    $source: String
    $fromDate: Date
    $untilDate: Date
  ) {
    links(
      perspectiveUUID: $perspectiveUUID
      query: { source: $source, fromDate: $fromDate, untilDate: $untilDate }
    ) {
      author {
        did
      }
      timestamp
      data {
        source
        predicate
        target
      }
    }
  }
`;

export const SOURCE_PREDICATE_LINK_QUERY_TIME_PAGINATED = gql`
  query links(
    $perspectiveUUID: String
    $source: String
    $predicate: String
    $fromDate: Date
    $untilDate: Date
  ) {
    links(
      perspectiveUUID: $perspectiveUUID
      query: {
        source: $source
        predicate: $predicate
        fromDate: $fromDate
        untilDate: $untilDate
      }
    ) {
      author {
        did
      }
      timestamp
      data {
        source
        predicate
        target
      }
    }
  }
`;

export const ADD_LINK = gql`
  mutation addLink($perspectiveUUID: String, $link: String) {
    addLink(input: { perspectiveUUID: $perspectiveUUID, link: $link }) {
      author {
        did
      }
      timestamp
      data {
        source
        predicate
        target
      }
    }
  }
`;

export const CREATE_EXPRESSION = gql`
  mutation createExpression($languageAddress: String, $content: String) {
    createExpression(
      input: { languageAddress: $languageAddress, content: $content }
    )
  }
`;

export const QUERY_EXPRESSION = gql`
  query expression($url: String) {
    expression(url: $url) {
      url
      author {
        did
      }
      timestamp
      data
      proof {
        signature
        key
        valid
        invalid
      }
    }
  }
`;

export const PUB_KEY_FOR_LANG = gql`
  query pubKeyForLanguage($lang: String) {
    pubKeyForLanguage(lang: $lang)
  }
`;

export const AD4M_SIGNAL = gql`
  subscription signal {
    signal {
      language
      signal
    }
  }
`;

export const LANGUAGE = gql`
  query langauge($address: String) {
    language(address: $address) {
      name
      address
      constructorIcon {
        code
      }
      iconFor {
        code
      }
      settings
      settingsIcon {
        code
      }
    }
  }
`;

export const INSTALL_SHARED_PERSPECTIVE = gql`
  mutation installSharedPerspective($url: String) {
    installSharedPerspective(url: $url) {
      name
      uuid
      sharedPerspective {
        name
        description
        type
        linkLanguages {
          address
          name
        }
        allowedExpressionLanguages
        requiredExpressionLanguages
      }
      sharedURL
    }
  }
`;
