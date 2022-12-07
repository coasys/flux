import { Link, LinkInput } from "@perspect3vism/ad4m";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";
import { LinkExpression, Literal } from "@perspect3vism/ad4m";

import {
  CARD_HIDDEN,
  CHANNEL,
  MEMBER,
  REACTION,
  EDITED_TO,
  REPLY_TO,
  ZOME,
} from "../constants/communityPredicates";
import { EntryType, PropertyMap, PredicateMap } from "../types";

export const findLink = {
  name: (link: LinkExpression) => link.data.predicate === "rdf://name",
  description: (link: LinkExpression) =>
    link.data.predicate === "rdf://description",
  language: (link: LinkExpression) => link.data.predicate === "language",
  dateCreated: (link: LinkExpression) =>
    link.data.predicate === "rdf://dateCreated",
};

export const linkIs = {
  message: (link: LinkExpression) => link.data.predicate === EntryType.Message,
  reply: (link: LinkExpression) => link.data.predicate === REPLY_TO,
  // TODO: SHould we check if the link is proof.valid?
  reaction: (link: LinkExpression) => link.data.predicate === REACTION,
  channel: (link: LinkExpression) => link.data.predicate === CHANNEL,
  member: (link: LinkExpression) => link.data.predicate === MEMBER,
  hideNeighbourhoodCard: (link: LinkExpression) =>
    link.data.predicate === CARD_HIDDEN,
  editedMessage: (link: LinkExpression) => link.data.predicate === EDITED_TO,
  socialDNA: (link: LinkExpression) => link.data.predicate === ZOME,

  // TODO: SHould we check if the link is proof.valid?
};

export function mapLiteralLinks(
  links: LinkExpression[] | undefined,
  map: PropertyMap
) {
  return Object.keys(map).reduce((acc, key) => {
    const predicate = map[key];
    const link = links?.find((link) => link.data.predicate === predicate);

    if (link) {
      let data;

      if (link.data.target.startsWith("literal://string:")) {
        data = Literal.fromUrl(link.data.target).get();
      } else if (link.data.target.startsWith("literal://number:")) {
        data = Literal.fromUrl(link.data.target).get();
      } else if (link.data.target.startsWith("literal://json:")) {
        data = Literal.fromUrl(link.data.target).get().data;
      } else {
        data = link.data.target;
      }

      return {
        ...acc,
        [key]: data,
      };
    }
    return acc;
  }, {});
}

export async function createLiteralLinks(source: string, map: PredicateMap) {
  const client = await getAd4mClient();

  const targets = Object.keys(map);

  const promises = targets
    .filter((predicate: any) => {
      return typeof map[predicate] === "string";
    })
    .map(async (predicate: string) => {
      const message = map[predicate];
      const exp = await client.expression.create(message, "literal");
      return new Link({ source, predicate, target: exp });
    });

  return Promise.all(promises);
}

//function to create links from a map of predicates to targets
export async function createLinks(source: string, map: PredicateMap) {
  const targets = Object.keys(map);

  const links = targets
    .filter((predicate: any) => {
      const isString =
        typeof map[predicate] === "string" && map[predicate] !== "";
      const isArray = Array.isArray(map[predicate]);
      return isString || isArray;
    })
    .map((predicate: string) => {
      const value = map[predicate];

      return Array.isArray(value)
        ? value.map((v) => new Link({ source, predicate, target: v }))
        : new Link({ source, predicate, target: value });
    });

  return links.flat();
}

export async function createLiteralObject({
  parent,
  children,
}: {
  parent: LinkInput;
  children: PredicateMap;
}) {
  const client = await getAd4mClient();
  const expUrl = await client.expression.create(parent.target, "literal");

  const parentLink = new Link({
    source: parent.source,
    predicate: parent.predicate,
    target: expUrl,
  });

  const childrenLinks = await createLiteralLinks(expUrl, children);

  return [parentLink, ...childrenLinks];
}

export async function getLiteralObjectLinks(
  targetExp: string,
  links: LinkExpression[]
) {
  const parentLink = links.find((l) => l.data.target === targetExp);
  if (parentLink) {
    const associatedLinks = links.filter(
      (link) => link.data.source === targetExp
    );

    return [parentLink, ...associatedLinks];
  } else {
    return [];
  }
}
