import createCommunity from "utils/api/createCommunity";
import { CommunityState } from "@/store/types";
import { useDataStore } from "..";
import { useAppStore } from "@/store/app";
import { ChannelView } from "utils/types";

export interface Payload {
  perspectiveName: string;
  image?: string;
  thumbnail?: string;
  description: string;
  perspectiveUuid?: string;
}

export default async ({
  perspectiveName,
  description,
  image = "",
  perspectiveUuid,
}: Payload): Promise<CommunityState> => {
  const dataStore = useDataStore();
  const appStore = useAppStore();

  try {
    const community = await createCommunity({
      perspectiveUuid: perspectiveUuid,
      name: perspectiveName,
      description,
      image,
    });

    const newCommunity = {
      neighbourhood: community,
      state: {
        perspectiveUuid: community.uuid,
        theme: {
          fontSize: "md",
          fontFamily: "Poppins",
          name: "light",
          hue: 270,
          saturation: 60,
        },
        useLocalTheme: false,
        hasNewMessages: false,
        collapseChannelList: false,
        currentChannelId: null,
        hideMutedChannels: false,
        notifications: {
          mute: false,
        },
      },
    } as CommunityState;

    dataStore.addCommunity(newCommunity);

    return newCommunity;
  } catch (e) {
    appStore.showDangerToast({
      message: e.message,
    });
    throw new Error(e);
  }
};
