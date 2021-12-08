import storeDb from "@/storeDb";

export interface TimeoutCacheItem {
  value: any;
  expiry: number;
}

export class TimeoutCache<T> {
  ttl: number;

  constructor(ttl: number) {
    this.ttl = ttl;
  }

  async set(key: string, value: T): Promise<void> {
    const now = new Date();

    const item: TimeoutCacheItem = {
      value,
      expiry: now.getTime() + this.ttl,
    };

    await storeDb.setItem(key, item);
  }

  async get(key: string): Promise<T | undefined> {
    const now = new Date();
    const item = await storeDb.getItem(key);
    if (!item) {
      return undefined;
    }

    const parseditem: TimeoutCacheItem = JSON.parse(item);

    if (now.getTime() > parseditem.expiry) {
      await storeDb.deleteItemByKey(key);

      return undefined;
    }

    return parseditem.value;
  }

  async remove(key: string): Promise<void> {
    await storeDb.deleteItemByKey(key);
  }
}

export default TimeoutCache;
