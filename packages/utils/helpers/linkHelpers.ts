import { LinkExpression } from "@perspect3vism/ad4m";
import { CARD_HIDDEN, CHANNEL, DIRECTLY_SUCCEEDED_BY, MEMBER, REACTION, REPLY_TO } from "../constants/ad4m";

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
    link.data.predicate === CARD_HIDDEN
    

  // TODO: SHould we check if the link is proof.valid?
};
