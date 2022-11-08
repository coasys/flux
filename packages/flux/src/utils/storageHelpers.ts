import Dexie from 'dexie';

export class DexieStorage extends Dexie {
  ipfs: Dexie.Table<IDexieIPFS, string>;

  constructor(perspectiveId: string, version = 1) {
    super(perspectiveId);
    this.version(version).stores({
      ipfs: 'id, data, timestamp',
    });
  }
}


export interface IDexieIPFS {
  id: string;
  data: string;
  timestamp: Date;
}

export class DexieIPFS {
  db: DexieStorage;
  
  constructor(perspectiveId: string, version = 1) {
    this.db = new DexieStorage(perspectiveId, version);
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