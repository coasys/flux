const cache: Map<string, any> = new Map();
const subscribers: Map<string, Function[]> = new Map();

export function getCache<T>(key: string) {
  const match: T | undefined = cache.get(key);
  return match;
}
export function setCache<T>(key: string, value: T) {
  cache.set(key, value);
  getSubscribers(key).forEach((cb) => cb());
}

export function subscribe(key: string, callback: Function) {
  getSubscribers(key).push(callback);
}

export function unsubscribe(key: string, callback: Function) {
  const subs = getSubscribers(key);
  const index = subs.indexOf(callback);
  if (index >= 0) {
    subs.splice(index, 1);
  }
}

function getSubscribers(key: string) {
  if (!subscribers.has(key)) subscribers.set(key, []);
  return subscribers.get(key)!;
}
