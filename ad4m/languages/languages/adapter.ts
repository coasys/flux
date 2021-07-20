import type {
  Address,
  Expression,
  ExpressionAdapter,
  PublicSharing,
  LanguageContext,
  HolochainLanguageDelegate,
} from "@perspect3vism/ad4m";
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

  async get(address: Address): Promise<Expression> {
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
