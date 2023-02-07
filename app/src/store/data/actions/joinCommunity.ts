import { joinCommunity } from "utils/api";
import { useDataStore } from "@/store/data";
import { useAppStore } from "@/store/app";
import { CommunityState } from "@/store/types";

export interface Payload {
  joiningLink: string;
}

export default async ({ joiningLink }: Payload): Promise<CommunityState> => {
  const dataStore = useDataStore();
  const appStore = useAppStore();

  try {
    const community = await joinCommunity({ joiningLink });

    const newCommunity = {
      neighbourhood: community,
      state: {
        perspectiveUuid: community.uuid,
        useLocalTheme: false,
        theme: {
          fontSize: "md",
          fontFamily: "Poppins",
          name: "light",
          hue: 270,
          saturation: 60,
        },
        currentChannelId: null,
        hasNewMessages: false,
        collapseChannelList: false,
        hideMutedChannels: false,
        notifications: {
          mute: false,
        },
      },
    };

    dataStore.addCommunity(newCommunity);

    return newCommunity;
  } catch (e) {
    appStore.showDangerToast({
      message: e.message,
    });
    throw new Error(e);
  }
};
