import level from "level";

const DB_NAME = "cachedb";
let DB: level.LevelDB | undefined;

export default {
  async getDb(): Promise<level.LevelDB> {
    if (!DB) {
      DB = await level(DB_NAME);
    }
    return DB!;
  },
  async deleteItemByKey(key: string): Promise<void> {
    const db = await this.getDb();

    await db.del(key);
  },
  async getItem(id: string): Promise<any | undefined> {
    const db = await this.getDb();

    try {
      return await db.get(id);
    } catch (e) {
      if (e.type == "NotFoundError") {
        return undefined;
      } else {
        throw new Error(e);
      }
    }
  },
  async setItem(key: string, item: any): Promise<void> {
    const db = await this.getDb();

    await db.put(item, key);
  },
};
