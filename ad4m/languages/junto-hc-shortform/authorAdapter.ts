import type Expression from "ad4m/Expression";
import type Address from 'ad4m/Address';
import Agent from 'ad4m/Agent';
import type { ExpressionAdapter, GetByAuthorAdapter, PublicSharing } from 'ad4m/Language';
import type LanguageContext from 'ad4m/LanguageContext';
import type { default as HolochainLanguageDelegate, HolochainService } from "language-context/lib/Holochain/HolochainLanguageDelegate";
import { DNA_NICK } from './dna'
export default class ShortFormAuthorAdapter implements GetByAuthorAdapter {
    #shortFormDNA: HolochainLanguageDelegate
    
    constructor(context: LanguageContext) {
        this.#shortFormDNA = context.Holochain as HolochainLanguageDelegate
    }

    //Question: For this author; assuming we resolved with profile DHT; how do we know which agent to use if they have multiple listed?
    //might not be a clear 1:1 mapping for did to agents
    ///Get expressions authored by a given Agent/Identity
    async getByAuthor(author: Agent, count: number, page: number): Promise<void | Expression[]> {
        //TODO: resolve did
        let res = await this.#shortFormDNA.call(DNA_NICK, "shortform", "get_by_author", {author: author.did, page_size: count, page_number: page})
        let out = [];
        res.forEach(expression => {
            out.push({
                //Might need to resolve creator to did information
                author: new Agent(expression.creator),
                timestamp: expression.created_at,
                data: JSON.parse(expression),
                proof: undefined
            });
        });
        return out
    }
}
