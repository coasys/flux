import { LinkExpression, Literal } from "@perspect3vism/ad4m";
import { CARD_HIDDEN, CHANNEL, DIRECTLY_SUCCEEDED_BY, EDITED_TO, MEMBER, REACTION, REPLY_TO, ZOME } from "../constants/communityPredicates";

export const findLink = {
  name: (link: LinkExpression) => link.data.predicate === "rdf://name",
  description: (link: LinkExpression) =>
    link.data.predicate === "rdf://description",
  language: (link: LinkExpression) => link.data.predicate === "language",
  dateCreated: (link: LinkExpression) => link.data.predicate === "rdf://dateCreated"
};

export const linkIs = {
  message: (link: LinkExpression) =>
    link.data.predicate === DIRECTLY_SUCCEEDED_BY,
  reply: (link: LinkExpression) =>
    link.data.predicate === REPLY_TO,
  // TODO: SHould we check if the link is proof.valid?
  reaction: (link: LinkExpression) =>
    link.data.predicate === REACTION,
  channel: (link: LinkExpression) => 
    link.data.predicate === CHANNEL,
  member: (link: LinkExpression) => 
    link.data.predicate === MEMBER,
  hideNeighbourhoodCard: (link: LinkExpression) =>
    link.data.predicate === CARD_HIDDEN,
  editedMessage: (link: LinkExpression) =>
    link.data.predicate === EDITED_TO,
  socialDNA: (link: LinkExpression) => link.data.predicate === ZOME
    

  // TODO: SHould we check if the link is proof.valid?
};

type MapKey = string;
type Predicate = string;

type Map = {
  [x: MapKey]: Predicate;
};

export function mapLiteralLinks(
  links: LinkExpression[] | undefined,
  map: Map
): Map {
  return Object.keys(map).reduce((acc, key) => {
    const predicate = map[key];
    const link = links?.find((link) => link.data.predicate === predicate);
    
    if (link) {
      return {
        ...acc,
        [key]: link.data.target.startsWith("literal://")
          ? Literal.fromUrl(link.data.target).get().data ? Literal.fromUrl(link.data.target).get().data : Literal.fromUrl(link.data.target).get()
          : link.data.target,
      };
    }
    return acc;
  }, {});
}
