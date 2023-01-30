export interface NeighbourhoodMeta {
  name: string;
  description: string;
  languages: { [x: string]: string };
}

export interface Community {
  uuid: string;
  author: string;
  timestamp: string;
  name: string;
  description: string;
  image: string;
  thumbnail: string;
  neighbourhoodUrl: string;
  members: string[];
  themes: string[];
}

export interface CommunityMetaData {
  name?: string;
  description?: string;
  image?: string;
  thumbnail?: string;
}

export interface NeighbourhoodMetaData {
  name: string;
  author?: string;
  timestamp?: string;
  description?: string;
}

export interface Channel {
  id: string;
  name: string;
  description: string;
  perspectiveUuid: string;
  timestamp: Date | string;
  author: string; // did
  views: ChannelView[];
}

export interface Reaction {
  author: string;
  content: string;
  timestamp: Date;
  synced: boolean;
}

export interface Message {
  id: string;
  author: string; // did
  content: string;
  reactions: Reaction[];
  timestamp: Date | string;
  reply?: string;
  isPopular: boolean;
  replies: any[];
  isNeighbourhoodCardHidden: boolean;
  editMessages: {
    content: string;
    author: string;
    timestamp: Date | string;
  }[];
  synced: boolean;
}

export interface Messages {
  [x: string]: Message;
}

export interface Profile {
  did: string;
  username: string;
  bio: string;
  email: string;
  givenName: string;
  familyName: string;
  profileBackground: string;
  profileThumbnailPicture: string;
  profilePicture: string;
}
export interface Profiles {
  [x: string]: Profile;
}

export enum ChannelView {
  Chat = "flux://has_chat_view",
  Forum = "flux://has_post_view",
  Graph = "flux://has_graph_view",
}

export enum EntryType {
  Community = "flux://has_community",
  Channel = "flux://has_channel",
  Message = "flux://has_message",
  Post = "flux://has_post",
  Member = "flux://has_member",
  Theme = "flux://has_theme",
}

//This represents an entry itself, which contains the default fields seen below
//and is then extended to include other fields depending on the type of entry
export interface Entry {
  id: string;
  author: string;
  timestamp: number;
  type: EntryType;
  source: string;
}

export interface Post extends Entry {
  image: string;
  url: string;
  reactions: Reaction[];
  isPopular: boolean;
  startDate: string;
  endDate: string;
  title: string;
  body: string;
  replies: Post;
}

export interface EntryInput {
  id?: string;
  perspectiveUuid: string;
  source?: string;
  type: EntryType;
  data: PredicateMap;
}

type Target = String;

//Represents the relationship between given predicate to a given expression url
export type PredicateMap = {
  [predicate: string]: Target | Target[];
};

//Represents the relationship between given predicate to any data type,
//this is usually used for data which has not being created as an expression yet
export type PredicateAnyMap = {
  [predicate: string]: any;
};

//Represents the relationship between a given property and its associated value
//This property is expected to be resolved in the Model to find the associated predicate
export type PropertyMap = {
  [property: string]: any;
};

//Represents the relationship between a given property to a given expression url
export type PropertyValueMap = {
  [property: string]: Target | Target[];
};

export interface GetEntry {
  id: string;
}

export interface GetEntries {
  perspectiveUuid: string;
  queries: PrologQuery[];
}

export interface PrologQuery {
  query: string;
  variables: {
    [x: string]: any;
  };
  resultKeys: string[];
}

export interface SdnaVersion {
  version: number;
  timestamp: Date;
}

export interface ModelProperty {
  predicate: string;
  type: StringConstructor | NumberConstructor;
  collection?: boolean;
  languageAddress?: string;
  resolve: boolean;
}
