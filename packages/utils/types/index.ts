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
  name: string;
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
