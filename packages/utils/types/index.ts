export interface NeighbourhoodMeta {
  name: string;
  description: string;
  languages: { [x: string]: string };
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
  }[]
}
export interface Messages {
  [x: string]: Message;
}

export interface Profile {
  did: string;
  url: string;
  author: string;
  timestamp: string;
  username: string;
  email: string;
  givenName: string;
  familyName: string;
  thumbnailPicture: string;
  profilePicture: string;
  isNeighbourhoodCardHidden: boolean;
}
export interface Profiles {
  [x: string]: Profile;
}
