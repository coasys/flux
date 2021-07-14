import { ad4mClient } from "@/app";
import { PerspectiveHandle } from "@perspect3vism/ad4m";

export function addPerspective(name: string): Promise<PerspectiveHandle> {
  return ad4mClient.perspective.add(name)
}
