import { DexieIPFS } from "../helpers/storageHelpers";

//Function which will cache image in dexie ipfs store
export function cacheImage(expUrl: string, image: string): void {    
    const dexie = new DexieIPFS("ipfs", 1);
    dexie.save(expUrl, image);
}