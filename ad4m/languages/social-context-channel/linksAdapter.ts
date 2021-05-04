import type Expression from "@perspect3vism/ad4m/Expression";
import type { LinksAdapter, NewLinksObserver } from "@perspect3vism/ad4m/Language";
import type Agent from "@perspect3vism/ad4m/Agent";
import type Link from "@perspect3vism/ad4m/Links";
import type LanguageContext from "@perspect3vism/ad4m-language-context/LanguageContext";
import type { default as HolochainLanguageDelegate } from "@perspect3vism/ad4m-language-context/lib/Holochain/HolochainLanguageDelegate";
import { DNA_NICK } from "./dna";
import { LinkQuery } from "@perspect3vism/ad4m/Links";

export class JuntoSocialContextLinkAdapter implements LinksAdapter {
  #socialContextDna: HolochainLanguageDelegate;

  constructor(context: LanguageContext) {
    //@ts-ignore
    this.#socialContextDna = context.Holochain as HolochainLanguageDelegate;
  }

  writable() {
    return true;
  }

  public() {
    return false;
  }

  async others(): Promise<Agent[]> {
    return await this.#socialContextDna.call(
      DNA_NICK,
      "social_context",
      "get_others",
      {}
    );
  }

  async addLink(link: Expression) {
    const data = prepareExpressionLink(link);
    //console.debug("Holochain Social Context: ADDING LINK!: ", data);
    //If target is an agent pub key, then we are just trying mark agent as active
    //@ts-ignore
    if (data.data.source == "active_agent") {
      await this.#socialContextDna.call(
        DNA_NICK,
        "social_context",
        "add_link",
        {
          link: data,
          index_strategy: "Simple",
        }
      );
    } else {
      await this.#socialContextDna.call(
        DNA_NICK,
        "social_context",
        "add_link",
        {
          link: data,
          index_strategy: "Full",
        }
      );
    }
  }

  async updateLink(
    oldLinkExpression: Expression,
    newLinkExpression: Expression
  ) {
    const source_link = prepareExpressionLink(oldLinkExpression);
    const target_link = prepareExpressionLink(newLinkExpression);
    await this.#socialContextDna.call(
      DNA_NICK,
      "social_context",
      "update_link",
      { source: source_link, target: target_link }
    );
  }

  async removeLink(link: Expression) {
    const data = prepareExpressionLink(link);
    await this.#socialContextDna.call(
      DNA_NICK,
      "social_context",
      "remove_link",
      data
    );
  }

  async getLinks(
    query: LinkQuery,
    from?: Date,
    until?: Date
  ): Promise<Expression[]> {
    query = new LinkQuery(query);
    const link_query = Object.assign(query);
    if (!link_query.source) {
      link_query.source = "root";
    }
    //console.debug("Holochain Social Context: Getting Links With: ", link_query);
    if (from) {
      link_query.from = from;
    }
    if (until) {
      link_query.until = until;
    }
    const links = await this.#socialContextDna.call(
      DNA_NICK,
      "social_context",
      "get_links",
      link_query
    );
    //console.debug("Holchain Social Context: Got Links", links);

    return links.filter((link) => query.isMatch(link.data as Link));
  }

  addCallback(callback: NewLinksObserver) {
    return 0;
  }

  handleHolochainSignal(signal: any) {
    //@ts-ignore
    this.ad4mSignal(signal);
  }
}

function prepareExpressionLink(link: Expression): object {
  const data = Object.assign(link);
  if (data.data.source == "") {
    data.data.source = null;
  }
  if (data.data.target == "") {
    data.data.target = null;
  }
  if (data.data.predicate == "") {
    data.data.predicate = null;
  }
  return data;
}
