import { ad4mClient } from "@/app";
import { PerspectiveHandle } from "@perspect3vism/ad4m";

export async function joinNeighbourhood(
  url: string
): Promise<PerspectiveHandle> {
  return ad4mClient.neighbourhood.joinFromUrl(url)
}
