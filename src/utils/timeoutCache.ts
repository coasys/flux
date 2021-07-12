interface TimeoutCacheItem {
  value: any;
  expiry: number;
}

export class TimeoutCache<T> {
  ttl: number;

  constructor(ttl: number) {
    this.ttl = ttl;
  }

  set(key: string, value: T) {
    const now = new Date();

    const item: TimeoutCacheItem = {
      value,
      expiry: now.getTime() + this.ttl,
    };

    localStorage.setItem(key, JSON.stringify(item));
  }

  get(key: string): T | undefined {
    const now = new Date();
    const item = localStorage.getItem(key);

    if (!item) {
      return undefined;
    }

    const parseditem: TimeoutCacheItem = JSON.parse(item);

    if (now.getTime() > parseditem.expiry) {
      localStorage.removeItem(key);

      return undefined;
    }

    return parseditem.value;
  }

  remove(key: string) {
    localStorage.removeItem(key);
  }
}
