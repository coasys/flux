import { openDB, IDBPDatabase } from "idb";
import { TimeoutCacheItem } from "./timeoutCache";

const DB_NAME = "cachedb";
let DB: IDBPDatabase | undefined;

export default {
  async getDb(): Promise<IDBPDatabase> {
    if (!DB) {
      DB = await openDB(DB_NAME);
    }
    return DB!;
  },
  async deleteItemByKey(key: string): Promise<void> {
    const db = await this.getDb();

    await db.delete("cache", key);
  },
  async getItem(id: string): Promise<any | undefined> {
    const db = await this.getDb();

    return await db.get("cache", id);
  },
  async saveItem(key: string, item: TimeoutCacheItem): Promise<void> {
    const db = await this.getDb();

    await db.put("cache", item, key);
  },
};
