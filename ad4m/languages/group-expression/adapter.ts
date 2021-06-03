import type Address from "@perspect3vism/ad4m/Address";
import type Agent from "@perspect3vism/ad4m/Agent";
import type {
  ExpressionProof,
  default as Expression,
} from "@perspect3vism/ad4m/Expression";
import type {
  ExpressionAdapter,
  PublicSharing,
} from "@perspect3vism/ad4m/Language";
import type LanguageContext from "@perspect3vism/ad4m-language-context/lib/LanguageContext";
import type { default as HolochainLanguageDelegate } from "@perspect3vism/ad4m-language-context/lib/Holochain/HolochainLanguageDelegate";
import type AgentService from "@perspect3vism/ad4m/AgentService";
import { DNA_NICK } from "./dna";

class GroupExpPutAdapter implements PublicSharing {
  #agent: AgentService;
  #hcDna: HolochainLanguageDelegate;

  constructor(context: LanguageContext) {
    this.#agent = context.agent;
    this.#hcDna = context.Holochain as HolochainLanguageDelegate;
  }

  async createPublic(obj: object): Promise<Address> {
    const expression = this.#agent.createSignedExpression(obj);
    const res = await this.#hcDna.call(
      DNA_NICK,
      "group-expression",
      "create_public_expression",
      {
        author: expression.author,
        data: JSON.stringify(expression.data),
        timestamp: expression.timestamp,
        proof: expression.proof,
      }
    );
    //TODO: add error handling here
    return res.holochain_data.element.signed_header.header.hash.toString("hex");
  }
}

export default class ShortFormAdapter implements ExpressionAdapter {
  #hcDna: HolochainLanguageDelegate;

  putAdapter: PublicSharing;

  constructor(context: LanguageContext) {
    this.#hcDna = context.Holochain as HolochainLanguageDelegate;
    this.putAdapter = new GroupExpPutAdapter(context);
  }

  async get(address: Address): Promise<void | Expression> {
    const hash = Buffer.from(address, "hex");
    const expression = await this.#hcDna.call(
      DNA_NICK,
      "group-expression",
      "get_expression_by_address",
      hash
    );
    if (expression != null) {
      const expressionSer = {
        author: {
          did: expression.expression_data["schema:agent"]["did:id"],
          name: expression.expression_data["schema:agent"]["schema:givenName"],
          email: expression.expression_data["schema:agent"]["schema:email"],
        } as Agent,
        data: {
          name: expression.expression_data["foaf:name"],
          description: expression.expression_data["schema:description"]
        },
        timestamp: expression.expression_data["schema:dateCreated"]["@value"],
        proof: {
          signature:
            expression.expression_data["sec:proof"]["sec:verificationMethod"],
          key: expression.expression_data["sec:proof"][
            "sec:jws"
          ],
        } as ExpressionProof,
      } as Expression;
      return expressionSer;
    } else {
      return null;
    }
  }
}
