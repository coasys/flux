import createCommunity from "utils/api/createCommunity";
import { CommunityState } from "@/store/types";
import { useDataStore } from "..";
import { useAppStore } from "@/store/app";

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
  thumbnail = "",
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
      thumbnail,
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
    // We add a default channel that is a reference to
    // the community itself. This way we can utilize the fractal nature of
    // neighbourhoods. Remember that this also need to happen in join community.
    await dataStore.createChannel({
      name: "Home",
      perspectiveUuid: community.uuid,
    });

    // @ts-ignore
    return newCommunity;
  } catch (e) {
    appStore.showDangerToast({
      message: e.message,
    });
    throw new Error(e);
  }
};
