import { ad4mClient } from "@/app";
import { Perspective, PerspectiveHandle } from "@perspect3vism/ad4m";

export function getPerspective(uuid: string): Promise<PerspectiveHandle | null> {
  return ad4mClient.perspective.byUUID(uuid)
}

export function getPerspectiveSnapshot(uuid: string): Promise<Perspective | null> {
  return ad4mClient.perspective.snapshotByUUID(uuid)
}