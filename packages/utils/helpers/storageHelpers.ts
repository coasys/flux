import Dexie from 'dexie';
import { differenceInMinutes } from 'date-fns'
import { Message, Profile } from '../types';

export const session = {
  set(key: string, value: Object | Array<any>) {
    const data = JSON.stringify(value);

    sessionStorage.setItem(key, data);
  },
  get(key: string): Object | Array<any> {
    const value = sessionStorage.getItem(key);
    return JSON.parse(value);
  },
};

export class DexieStorage extends Dexie {
  messages: Dexie.Table<IDexieMessage, string>;
  profile: Dexie.Table<IDexieProfile, string>;
  ui: Dexie.Table<IDexieUI, string>;

  constructor(perspectiveId: string, version = 1) {
    super(perspectiveId);
    this.version(version).stores({
      messages: 'id, expression, timestamp',
      profile: 'id, expression, timestamp',
      ui: 'id, data, timestamp'
    });
  }
}

export interface IDexieProfile {
  id: string;
  expression: Profile;
  timestamp: Date;
}

export class DexieProfile {
  db: DexieStorage
  constructor(perspectiveId: string, version = 1) {
    this.db = new DexieStorage(perspectiveId, version);
  }

  async save(url: string, profile: Profile) {
    await this.db.profile.put({
      id: url,
      expression: profile,
      timestamp: new Date()
    });
  }

  async get(url: string) {
    const item = await this.db.profile.get(url);
    const now = new Date();

    if (item && differenceInMinutes(now, item.timestamp) <= 1) {
      return item.expression;
    } else {
      return undefined;
    }
  }
}

export interface IDexieMessage {
  id: string;
  expression: Message;
  timestamp: Date;
}

export class DexieMessages {
  db: DexieStorage
  constructor(perspectiveId: string, version = 1) {
    this.db = new DexieStorage(perspectiveId, version);
  }

  async save(url: string, message: Message) {
    await this.db.messages.put({
      id: url,
      expression: message,
      timestamp: new Date()
    });
  }

  async saveAll(messages: Message[]) {
    const formattedMessages = messages.map(e => ({id: e.id, expression: e, timestamp: new Date()}))
    await this.db.messages.bulkPut(formattedMessages)
  }

  async get(url: string) {
    const item = await this.db.messages.get(url);
    const now = new Date();

    if (item && differenceInMinutes(now, item.timestamp) <= 5) {
      return item.expression;
    } else {
      return undefined;
    }
  }

  async getAll() {
    const formattedMessages = await this.db.messages.toArray();
    return formattedMessages.reduce((acc, expression) => {
      const now = new Date();
      if (expression && differenceInMinutes(now, expression.timestamp) <= 5) {
        return { ...acc, [expression.id]: expression.expression };
      }

      return acc;
    }, {});
  }
}

export interface IDexieUI {
  id: string;
  data: string;
}

export class DexieUI {
  db: DexieStorage
  constructor(perspectiveId: string, version = 1) {
    this.db = new DexieStorage(perspectiveId, version);
  }

  async save(id: string, data: any) {
    await this.db.ui.put({
      id,
      data
    });
  }

  async get(id: string) {
    const item = await this.db.ui.get(id);
    if (item) return item.data;
    else return undefined;
  }
}