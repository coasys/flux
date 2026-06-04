import { Ad4mClient, Link, LinkInput, LinkExpression, Literal } from '@coasys/ad4m';
import { community } from '@coasys/flux-constants';
import { EntryType, PropertyMap, PredicateMap } from '@coasys/flux-types';
import { unwrapLiteralValue } from './unwrapLiteralValue';

const { CARD_HIDDEN, CHANNEL, MEMBER, REACTION, EDITED_TO, HAS_REPLY, ZOME } = community;

export const findLink = {
  name: (link: LinkExpression) => link.data.predicate === 'rdf://name',
  description: (link: LinkExpression) => link.data.predicate === 'rdf://description',
  language: (link: LinkExpression) => link.data.predicate === 'language',
  dateCreated: (link: LinkExpression) => link.data.predicate === 'rdf://dateCreated',
};

export const linkIs = {
  message: (link: LinkExpression) => link.data.predicate === EntryType.Message,
  reply: (link: LinkExpression) => link.data.predicate === HAS_REPLY,
  // TODO: SHould we check if the link is proof.valid?
  reaction: (link: LinkExpression) => link.data.predicate === REACTION,
  channel: (link: LinkExpression) => link.data.predicate === CHANNEL,
  member: (link: LinkExpression) => link.data.predicate === MEMBER,
  hideNeighbourhoodCard: (link: LinkExpression) => link.data.predicate === CARD_HIDDEN,
  editedMessage: (link: LinkExpression) => link.data.predicate === EDITED_TO,
  socialDNA: (link: LinkExpression) => link.data.predicate === ZOME,

  // TODO: SHould we check if the link is proof.valid?
};

export function mapLiteralLinks(links: LinkExpression[] | undefined, map: PropertyMap) {
  return Object.keys(map).reduce((acc, key) => {
    const predicate = map[key];
    const link = links?.find((link) => link.data.predicate === predicate);

    if (link) {
      const decoded = unwrapLiteralValue(link.data.target);
      return {
        ...acc,
        [key]: decoded ?? link.data.target,
      };
    }
    return acc;
  }, {});
}

export async function createLiteralLinks(_client: Ad4mClient, source: string, map: PredicateMap) {
  // Values land as deterministic `literal:string:` targets — the link reifier
  // carries the author/timestamp/proof for the write itself.
  return Object.keys(map)
    .filter((predicate) => typeof map[predicate] === 'string')
    .map((predicate) => {
      const target = Literal.from(map[predicate] as string).toUrl();
      return new Link({ source, predicate, target });
    });
}

//function to create links from a map of predicates to targets
export async function createLinks(source: string, map: PredicateMap) {
  const targets = Object.keys(map);

  const links = targets
    .filter((predicate: any) => {
      const isString = typeof map[predicate] === 'string';
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

export async function createLiteralObject(
  client: Ad4mClient,
  { parent, children }: { parent: LinkInput; children: PredicateMap },
) {
  // The deterministic literal URL doubles as a stable entity identity for
  // the children to attach to — two calls with the same `parent.target`
  // resolve to the same parent IRI, which is the intended semantics for
  // value-keyed entities like web links.
  const parentTarget = Literal.from(parent.target).toUrl();

  const parentLink = new Link({
    source: parent.source,
    predicate: parent.predicate,
    target: parentTarget,
  });

  const childrenLinks = await createLiteralLinks(client, parentTarget, children);

  return [parentLink, ...childrenLinks];
}

export async function getLiteralObjectLinks(targetExp: string, links: LinkExpression[]) {
  const parentLink = links.find((l) => l.data.target === targetExp);
  if (parentLink) {
    const associatedLinks = links.filter((link) => link.data.source === targetExp);

    return [parentLink, ...associatedLinks];
  } else {
    return [];
  }
}
