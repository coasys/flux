import type { LinkExpression } from "@perspect3vism/ad4m";
import { PerspectiveHandle } from "@perspect3vism/ad4m";
import { JuntoExpressionReference, ExpressionAndRef } from "./expression";
import { ProfileExpression } from "./userprofile";

export interface NeighbourhoodState {
  createdAt?: string;
  name: string;
  description: string;
  creatorDid: string;
  image?: string;
  thumbnail?: string;
  perspective: PerspectiveHandle;
  typedExpressionLanguages: JuntoExpressionReference[];
  groupExpressionRef?: string;
  neighbourhoodUrl: string;
  membraneType: MembraneType;
  membraneRoot?: string;
  linkedPerspectives: string[];
  linkedNeighbourhoods: string[];
  members: ProfileExpression[];
  currentExpressionLinks: { [x: string]: LinkExpression };
  currentExpressionMessages: { [x: string]: ExpressionAndRef };
}

export enum MembraneType {
  Inherited,
  Unique,
}
