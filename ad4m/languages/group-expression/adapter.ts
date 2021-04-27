import type Address from "ad4m/Address";
import type Agent from "ad4m/Agent";
import type Expression from "ad4m/Expression";
import type { ExpressionAdapter, PublicSharing } from "ad4m/Language";
import type LanguageContext from "language-context/lib/LanguageContext";
import type { default as HolochainLanguageDelegate } from "language-context/lib/Holochain/HolochainLanguageDelegate";
import type AgentService from "ad4m/AgentService";
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
      const acai_expression: Expression = Object.assign(
        expression.expression_data
      );
      return acai_expression;
    } else {
      return null;
    }
  }

  /// Send an expression to someone privately p2p
  send_private(to: Agent, content: object) {
    console.error("Send private not supported in this DNA")
  }

  /// Get private expressions sent to you
  async inbox(filterFrom: void | Agent[]): Promise<Expression[]> {
    return [];
  }
}
