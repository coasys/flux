import type Expression from "@perspect3vism/ad4m/Expression";
import type Agent from "@perspect3vism/ad4m/Agent";
import type { GetByAuthorAdapter } from "@perspect3vism/ad4m/Language";
import type { HolochainLanguageDelegate } from "@perspect3vism/ad4m/LanguageContext";
import type LanguageContext from "@perspect3vism/ad4m/LanguageContext";
import { DNA_NICK } from "./dna";
export default class ShortFormAuthorAdapter implements GetByAuthorAdapter {
  #shortFormDNA: HolochainLanguageDelegate;

  constructor(context: LanguageContext) {
    this.#shortFormDNA = context.Holochain as HolochainLanguageDelegate;
  }

  //Question: For this author; assuming we resolved with profile DHT; how do we know which agent to use if they have multiple listed?
  //might not be a clear 1:1 mapping for did to agents
  ///Get expressions authored by a given Agent/Identity
  async getByAuthor(
    author: Agent,
    count: number,
    page: number
  ): Promise<void | Expression[]> {
    //TODO: resolve did
    const res = await this.#shortFormDNA.call(
      DNA_NICK,
      "shortform",
      "get_by_author",
      { author: author.did, page_size: count, page_number: page }
    );
    const out = [];
    res.forEach((expression) => {
      const ad4mExpression: Expression = Object.assign(
        expression.expression_data
      );
      out.push(ad4mExpression);
    });
    return out;
  }
}
