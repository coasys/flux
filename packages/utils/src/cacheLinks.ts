import { DexieLinks } from "./storageHelpers";

export function cacheLinks(url: string, data: any): void {
  const dexie = new DexieLinks("links");
  dexie.save(url, data);
}

export async function getCacheLinks(url: string) {
  const dexie = new DexieLinks("links");
  const data = await dexie.get(url);
  return data;
}
