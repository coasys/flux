import { PerspectiveHandle } from "@perspect3vism/ad4m";

export interface NeighbourhoodState {
  createdAt?: string;
  name: string;
  description: string;
  creatorDid: string;
  image?: string;
  thumbnail?: string;
  perspective: PerspectiveHandle;
  neighbourhoodUrl: string;
  membraneRoot: string;
  linkedPerspectives: string[];
  linkedNeighbourhoods: string[];
  members: string[];
}
