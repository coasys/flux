import Dexie from 'dexie';
import { differenceInMinutes } from 'date-fns'
import { Message, Profile } from '../types';

export const session = {
  set(key: string, value: Object | Array<any>) {
    const data = JSON.stringify(value);

    sessionStorage.setItem(key, data);
  },
  get(key: string): Object | Array<any> | null {
    const value = sessionStorage.getItem(key);
    if (value) {
      return JSON.parse(value);
    } else {
      return null;
    }
  },
};

export interface IDexieIPFS {
  id: string;
  data: string;
  timestamp: Date;
}

export interface IDexieProfile {
  id: string;
  expression: Profile;
  timestamp: Date;
}

export class DexieStorage extends Dexie {
  profile: Dexie.Table<IDexieProfile, string>;
  ipfs: Dexie.Table<IDexieIPFS, string>;

  constructor(perspectiveId: string, version = 1) {
    super(perspectiveId);
    this.version(version).stores({
      profile: 'id, expression, timestamp',
      ipfs: 'id, data, timestamp'
    });
  }
}

export class DexieProfile {
  db: DexieStorage
  constructor(databaseName: string, version = 1) {
    this.db = new DexieStorage(databaseName, version);
  }

  async save(did: string, profile: Profile) {
    await this.db.profile.put({
      id: did,
      expression: profile,
      timestamp: new Date()
    });
  }

  async get(did: string) {
    const item = await this.db.profile.get(did);
    const now = new Date();

    if (item && differenceInMinutes(now, item.timestamp) <= 1) {
      return item.expression;
    } else {
      return undefined;
    }
  }
}

export class DexieIPFS {
  db: DexieStorage;
  
  constructor(databaseName: string, version = 1) {
    this.db = new DexieStorage(databaseName, version);
  }

  async save(url: string, data: string) {
    await this.db.ipfs.put({
      id: url,
      data,
      timestamp: new Date()
    });
  }

  async get(url: string) {
    const item = await this.db.ipfs.get(url);

    if (item) {
      return item.data;
    } else {
      return undefined;
    }
  }
}