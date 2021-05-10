import type Expression from "@perspect3vism/ad4m/Expression";
import type {
  LinksAdapter,
  NewLinksObserver,
} from "@perspect3vism/ad4m/Language";
import type Agent from "@perspect3vism/ad4m/Agent";
import type Link from "@perspect3vism/ad4m/Links";
import type LanguageContext from "@perspect3vism/ad4m-language-context/LanguageContext";
import type { default as HolochainLanguageDelegate } from "@perspect3vism/ad4m-language-context/Holochain/HolochainLanguageDelegate";
import { DNA_NICK } from "./dna";
import { LinkQuery } from "@perspect3vism/ad4m/Links";
import { link } from "fs";

export class JuntoSocialContextLinkAdapter implements LinksAdapter {
  #socialContextDna: HolochainLanguageDelegate;

  constructor(context: LanguageContext) {
    //@ts-ignore
    this.#socialContextDna = context.Holochain as HolochainLanguageDelegate;
  }

  writable(): boolean {
    return true;
  }

  public(): boolean {
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

  async addLink(link: Expression): Promise<void> {
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
      await this.#socialContextDna.call(
        DNA_NICK,
        "social_context",
        "index_link",
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
          index_strategy: "Simple",
        }
      );
      await this.#socialContextDna.call(
        DNA_NICK,
        "social_context",
        "index_link",
        {
          link: data,
          index_strategy: "Simple",
        }
      );
    }
  }

  async updateLink(
    oldLinkExpression: Expression,
    newLinkExpression: Expression
  ): Promise<void> {
    const source_link = prepareExpressionLink(oldLinkExpression);
    const target_link = prepareExpressionLink(newLinkExpression);
    await this.#socialContextDna.call(
      DNA_NICK,
      "social_context",
      "update_link",
      { source: source_link, target: target_link }
    );
  }

  async removeLink(link: Expression): Promise<void> {
    const data = prepareExpressionLink(link);
    await this.#socialContextDna.call(
      DNA_NICK,
      "social_context",
      "remove_link",
      data
    );
  }

  async getLinks(query: LinkQuery): Promise<Expression[]> {
    query = new LinkQuery(query);
    const link_query = Object.assign(query);
    if (!link_query.source) {
      link_query.source = "root";
    }
    if (link_query.source == undefined) {
      link_query.source = null;
    }
    if (link_query.target == undefined) {
      link_query.target = null;
    }
    if (link_query.predicate == undefined) {
      link_query.predicate = null;
    }
    if (link_query.from == undefined) {
      link_query.from = new Date().toISOString();
    }
    if (link_query.to == undefined) {
      link_query.until = new Date().toISOString();
    }
    console.debug("Holochain Social Context: Getting Links With: ", link_query);
    const links = await this.#socialContextDna.call(
      DNA_NICK,
      "social_context",
      "get_links",
      link_query
    );
    //console.debug("Holchain Social Context: Got Links", links);

    return links;
  }

  addCallback(callback: NewLinksObserver): number {
    return 0;
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
