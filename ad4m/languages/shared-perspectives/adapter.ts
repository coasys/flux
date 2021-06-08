import type Address from "@perspect3vism/ad4m/Address";
import type Expression from "@perspect3vism/ad4m/Expression";
import type {
  ExpressionAdapter,
  PublicSharing,
} from "@perspect3vism/ad4m/Language";
import type { IPFSNode } from "@perspect3vism/ad4m/LanguageContext";
import type LanguageContext from "@perspect3vism/ad4m/LanguageContext";
import type AgentService from "@perspect3vism/ad4m/AgentService";
//import { DNA_NICK } from "./dna";

const _appendBuffer = (buffer1, buffer2) => {
  const tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
  tmp.set(new Uint8Array(buffer1), 0);
  tmp.set(new Uint8Array(buffer2), buffer1.byteLength);
  return tmp.buffer;
};

const uint8ArrayConcat = (chunks) => {
  return chunks.reduce(_appendBuffer);
};

class SharedPerspectivePutAdapter implements PublicSharing {
  #agent: AgentService;
  #IPFS: IPFSNode;
  //#hcDna: HolochainLanguageDelegate;

  constructor(context: LanguageContext) {
    this.#agent = context.agent;
    this.#IPFS = context.IPFS;
    //this.#hcDna = context.Holochain as HolochainLanguageDelegate;
  }

  async createPublic(sharedPerspective: object): Promise<Address> {
    // console.log("Got object", sharedPerspective);
    // //@ts-ignore
    // const obj = JSON.parse(sharedPerspective);
    // console.log("parsed into", obj);
    // const expression = this.#agent.createSignedExpression(sharedPerspective);
    // console.log("Signed expression", expression);
    // const reqData = { key: obj.key, sharedPerspective: expression };
    // console.log("sending req", reqData);

    // await this.#hcDna.call(
    //   DNA_NICK,
    //   "shared_perspective_index",
    //   "index_shared_perspective",
    //   reqData
    // );
    // return reqData.key;
    const agent = this.#agent;
    const expression = agent.createSignedExpression(sharedPerspective);
    const content = JSON.stringify(expression);
    const result = await this.#IPFS.add({ content });
    // @ts-ignore
    return result.cid.toString() as Address;
  }
}

export default class Adapter implements ExpressionAdapter {
  #IPFS: IPFSNode;
  //#hcDna: HolochainLanguageDelegate;

  putAdapter: PublicSharing;

  constructor(context: LanguageContext) {
    this.#IPFS = context.IPFS;
    //this.#hcDna = context.Holochain as HolochainLanguageDelegate;
    this.putAdapter = new SharedPerspectivePutAdapter(context);
  }

  async get(address: Address): Promise<void | Expression> {
    const cid = address.toString();

    const chunks = [];
    // @ts-ignore
    for await (const chunk of this.#IPFS.cat(cid)) {
      chunks.push(chunk);
    }

    const fileString = uint8ArrayConcat(chunks).toString();
    const fileJson = JSON.parse(fileString);
    return fileJson;
    // const cid = address.toString();
    // //TODO: right now we are just returning the latest shared perspective under a given index but we actually will want to return
    // //all sharedperspectives. This might mean changing the way expression signing works or just ignoring expression signing for the interim.
    // const res = await this.#hcDna.call(
    //   DNA_NICK,
    //   "shared_perspective_index",
    //   "get_latest_shared_perspective",
    //   cid
    // );
    // if (res != null) {
    //   const expr: Expression = Object.assign(res.expression_data);
    //   return expr;
    // } else {
    //   return null;
    // }
  }
}
