import { ad4mClient } from "@/app";
import { Perspective } from "@perspect3vism/ad4m";

export function createNeighbourhood(
  perspective: string,
  linkLanguage: string,
  meta: Perspective
): Promise<string> {
  return ad4mClient.neighbourhood.publishFromPerspective(perspective, linkLanguage, meta)
}
