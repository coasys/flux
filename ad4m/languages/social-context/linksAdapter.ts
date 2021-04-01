import type Expression from "ad4m/Expression";
import type { LinksAdapter, NewLinksObserver } from "ad4m/Language";
import { parseExprURL } from "ad4m/ExpressionRef";
import type Agent from "ad4m/Agent";
import type Link from "ad4m/Links";
import type LanguageContext from "ad4m/LanguageContext";
import type ExpressionRef from "ad4m/ExpressionRef";
import type { default as HolochainLanguageDelegate, HolochainService } from "language-context/lib/Holochain/HolochainLanguageDelegate";
import { DNA_NICK } from './dna'
import { LinkQuery } from "ad4m/Links";

export class JuntoSocialContextLinkAdapter implements LinksAdapter {
    #socialContextDna: HolochainLanguageDelegate

    constructor(context: LanguageContext) {
        //@ts-ignore
        this.#socialContextDna = context.Holochain as HolochainLanguageDelegate
    }

    writable() {
        return true
    }

    public() {
        return false
    }

    async others(): Promise<Agent[]> {
        return await this.#socialContextDna.call(DNA_NICK, "social_context", "get_others", {})
    }

    async addLink(link: Expression) {
        let data = prepareExpressionLink(link);
        console.debug("Holochain Social Context: ADDING LINK!: ", data);
        await this.#socialContextDna.call(DNA_NICK, "social_context", "add_link", data)
    }

    async updateLink(oldLinkExpression: Expression, newLinkExpression: Expression) {
        let source_link = prepareExpressionLink(oldLinkExpression);
        let target_link = prepareExpressionLink(newLinkExpression);
        await this.#socialContextDna.call(DNA_NICK, "social_context", "update_link", {source: source_link, target: target_link})
    }

    async removeLink(link: Expression) {
        let data = prepareExpressionLink(link);
        await this.#socialContextDna.call(DNA_NICK, "social_context", "remove_link", data)
    }

    async getLinks(query: LinkQuery, from?: Date, until?: Date): Promise<Expression[]> {
        query = new LinkQuery(query)
        let link_query = Object.assign(query);  
        if (!link_query.source) {
            link_query.source = "root";
        };
        console.debug("Holochain Social Context: Getting Links With: ", link_query); 
        if (from) {
            link_query.from = from
        };
        if (until) {
            link_query.until = until;
        };
        let links = await this.#socialContextDna.call(DNA_NICK, "social_context", "get_links", link_query)
        console.debug("Holchain Social Context: Got Links", links);

        return links.filter(link => query.isMatch(link.data as Link))
    }

    addCallback(callback: NewLinksObserver) {
        console.error("No callbacks can be added to this link language");
        return 0
    }
}

function prepareExpressionLink(link: Expression): object {
    let data = Object.assign(link);
    if (data.data.subject == '') {
        data.data.subject = null;
    };
    if (data.data.target == '') {
        data.data.target = null;
    };
    if (data.data.predicate == '') {
        data.data.predicate = null;
    };
    return data
}