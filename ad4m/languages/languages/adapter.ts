import type Address from "ad4m/Address";
import type Expression from "ad4m/Expression";
import type { ExpressionAdapter, PublicSharing } from "ad4m/Language";
import type LanguageContext from "ad4m/LanguageContext";
import type HolochainLanguageDelegate from "language-context/lib/Holochain/HolochainLanguageDelegate";
import { IpfsPutAdapter } from "./putAdapter";
import { DNA_NICK } from "./dna";

const _appendBuffer = (buffer1, buffer2) => {
  const tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
  tmp.set(new Uint8Array(buffer1), 0);
  tmp.set(new Uint8Array(buffer2), buffer1.byteLength);
  return tmp.buffer;
};

const uint8ArrayConcat = (chunks) => {
  return chunks.reduce(_appendBuffer);
};

export default class Adapter implements ExpressionAdapter {
  #holochain: HolochainLanguageDelegate;

  putAdapter: PublicSharing;

  constructor(context: LanguageContext) {
    this.#holochain = context.Holochain as HolochainLanguageDelegate;
    this.putAdapter = new IpfsPutAdapter(context);
  }

  async get(address: Address): Promise<void | Expression> {
    const { expressions } = await this.#holochain.call(
      DNA_NICK,
      "anchored-expression",
      "get_expressions",
      { key: address }
    );

    if (expressions.length === 0) return null;

    const expression = expressions.pop();
    expressions.data = JSON.parse(Buffer.from(expression.data).toString());
    return expression;
  }
}
