import type Address from "ad4m/Address";
import Agent from "ad4m/Agent";
import type Expression from "ad4m/Expression";
import type { ExpressionAdapter, PublicSharing } from "ad4m/Language";
import type LanguageContext from "ad4m/LanguageContext";
import type { default as HolochainLanguageDelegate } from "language-context/lib/Holochain/HolochainLanguageDelegate";
import type AgentService from "ad4m/AgentService";
import { DNA_NICK } from "./dna";

class ShortFormPutAdapter implements PublicSharing {
  #agent: AgentService;
  #shortFormDNA: HolochainLanguageDelegate;

  constructor(context: LanguageContext) {
    this.#agent = context.agent;
    this.#shortFormDNA = context.Holochain as HolochainLanguageDelegate;
  }

  async createPublic(shortForm: object): Promise<Address> {
    //@ts-ignore
    const obj = JSON.parse(shortForm);
    const expression = this.#agent.createSignedExpression(shortForm);

    const res = await this.#shortFormDNA.call(
      DNA_NICK,
      "shortform",
      "create_public_expression",
      expression
    );
    return res.holochain_data.element.signed_header.header.hash.toString("hex");
  }
}

export default class ShortFormAdapter implements ExpressionAdapter {
  #shortFormDNA: HolochainLanguageDelegate;

  putAdapter: PublicSharing;

  constructor(context: LanguageContext) {
    this.#shortFormDNA = context.Holochain as HolochainLanguageDelegate;
    this.putAdapter = new ShortFormPutAdapter(context);
  }

  async get(address: Address): Promise<void | Expression> {
    const hash = Buffer.from(address, "hex");
    const expression = await this.#shortFormDNA.call(
      DNA_NICK,
      "shortform",
      "get_expression_by_address",
      hash
    );
    if (expression != null) {
      console.log("Got expression====", expression);
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
    //@ts-ignore
    const obj = JSON.parse(content);

    this.#shortFormDNA.call(DNA_NICK, "shortform", "send_private", {
      to: to,
      data: JSON.stringify(obj),
    });
  }

  /// Get private expressions sent to you
  async inbox(filterFrom: void | Agent[]): Promise<Expression[]> {
    //TODO: add from & pages to inbox
    if (filterFrom != null) {
      filterFrom = filterFrom[0];
    }
    const res = await this.#shortFormDNA.call(
      DNA_NICK,
      "shortform",
      "get_inbox",
      { from: filterFrom, page_size: 0, page_number: 0 }
    );
    const out = [];
    res.forEach((expression) => {
      out.push({
        author: new Agent(expression.creator),
        timestamp: expression.created_at,
        data: JSON.parse(expression),
        proof: undefined,
      });
    });
    return out;
  }
}
