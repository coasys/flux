import type Address from "@perspect3vism/ad4m/Address";
import type {
  LanguageAdapter as Interface,
  PublicSharing,
} from "@perspect3vism/ad4m/Language";
import type LanguageContext from "@perspect3vism/ad4m-language-context/LanguageContext";
import type { IPFSNode } from "@perspect3vism/ad4m-language-context/LanguageContext";

const _appendBuffer = (buffer1, buffer2) => {
  const tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
  tmp.set(new Uint8Array(buffer1), 0);
  tmp.set(new Uint8Array(buffer2), buffer1.byteLength);
  return tmp.buffer;
};

const uint8ArrayConcat = (chunks) => {
  return chunks.reduce(_appendBuffer);
};

export default class LanguageAdapter implements Interface {
  #IPFS: IPFSNode;

  putAdapter: PublicSharing;

  constructor(context: LanguageContext) {
    this.#IPFS = context.IPFS;
  }

  async getLanguageSource(address: Address): Promise<string> {
    const cid = address.toString();

    const chunks = [];
    // @ts-ignore
    for await (const chunk of this.#IPFS.cat(cid)) {
      chunks.push(chunk);
    }

    const fileString = Buffer.from(uint8ArrayConcat(chunks)).toString();
    return fileString;
  }
}
