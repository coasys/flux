import { DexieIPFS } from "./storageHelpers";

//Function which will cache image in dexie ipfs store
export function cacheImage(expUrl: string, image: string): void {
  const dexie = new DexieIPFS("ipfs");
  dexie.save(expUrl, image);
}
