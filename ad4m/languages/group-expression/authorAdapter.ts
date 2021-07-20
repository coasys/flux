import type {
  Expression,
  HolochainLanguageDelegate,
  GetByAuthorAdapter,
  LanguageContext,
} from "@perspect3vism/ad4m";
import { DNA_NICK } from "./dna";

export default class ShortFormAuthorAdapter implements GetByAuthorAdapter {
  #hcDNA: HolochainLanguageDelegate;

  constructor(context: LanguageContext) {
    this.#hcDNA = context.Holochain as HolochainLanguageDelegate;
  }

  //Question: For this author; assuming we resolved with profile DHT; how do we know which agent to use if they have multiple listed?
  //might not be a clear 1:1 mapping for did to agents
  ///Get expressions authored by a given Agent/Identity
  async getByAuthor(
    author: string,
    count: number,
    page: number
  ): Promise<Expression[]> {
    //TODO: resolve did
    const res = await this.#hcDNA.call(
      DNA_NICK,
      "group-expression",
      "get_by_author",
      { author: author, page_size: count, page_number: page }
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
