export interface NeighbourhoodMeta {
  name: string;
  description: string;
  languages: { [x: string]: string };
}

export interface Channel {
  id: string;
  name: string;
  description: string;
  perspectiveUuid: string;
  timestamp: Date | string;
  author: string; // did
  views: string[];
}

export interface Reaction {
  author: string;
  content: string;
  timestamp: Date;
}

export interface Message {
  id: string;
  author: string; // did
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
  profileBg: string;
  thumbnailPicture: string;
  profilePicture: string;
}
export interface Profiles {
  [x: string]: Profile;
}

export enum EntryType {
  "flux://post",
  "flux://message",
  "flux://channel",
}

export type Did = string;

export interface Entry {
  id: string;
  author: Did;
  createdAt: Date;
  type: EntryType[];
  source?: string;
  data?: PredicateMap;
}

export type PredicateMap = {
  [predicate: string]: string;
};

export interface EntryInput {
  perspectiveUuid: string;
  source?: string;
  type: EntryType[] | EntryType;
  data: PredicateMap;
}
