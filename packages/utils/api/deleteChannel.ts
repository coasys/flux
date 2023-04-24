import { getAd4mClient } from "@perspect3vism/ad4m-connect/utils";
import { SubjectRepository } from "utils/factory";
import { Channel as ChannelModel } from "utils/api";

export interface LinkData {
  id: string;
  timestamp: Date | string;
  author: string;
}

export async function deleteChannel(
  perspectiveUuid: string,
  linkData: LinkData
): Promise<void> {
  const channelRepository = new SubjectRepository(ChannelModel, {
    perspectiveUuid
  })

  await channelRepository.remove(linkData.id);
}
