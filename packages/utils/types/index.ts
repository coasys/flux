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
  Chat = "CHAT",
  Forum = "FORUM",
}

export enum EntryType {
  Message = "flux://message",
  SimplePost = "flux://simple_post",
  ImagePost = "flux://image_post",
  PollPost = "flux://poll_post",
  CalendarEvent = "flux://calendar_event",
}

export interface Entry {
  id: string;
  author: String;
  timestamp: Date;
  types: EntryType[];
  source?: string;
  data?: PredicateAnyMap;
}

export interface Post extends Entry {
  image: string;
  reactions: Reaction[];
  isPopular: boolean;
  title: string;
  body: string;
  replies: Post;
}

export interface EntryInput {
  perspectiveUuid: string;
  source?: string;
  types: EntryType[];
  data: PredicateMap;
}

export type PredicateMap = {
  [predicate: string]: string;
};

export type PredicateAnyMap = {
  [predicate: string]: any;
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
  resultKeys: string[];
  arguments: any[];
}

export enum PrologQueries {
  GetMessages,
  GetForumPosts,
  GetChannel,
  GetNeighbourhood,
}

export interface SdnaVersion {
  version: number;
  timestamp: Date;
}
