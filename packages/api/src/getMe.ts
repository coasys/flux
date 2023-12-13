import { getAd4mClient } from "@coasys/ad4m-connect/utils";
import { Ad4mClient, Perspective } from "@coasys/ad4m";

export type Me = {
  did: string;
  perspective?: Perspective;
  directMessageLanguage?: string;
  isUnlocked: boolean;
  isInitialized: boolean;
};

export default async function getMe(): Promise<Me> {
  try {
    const client: Ad4mClient = await getAd4mClient();

    const me = await client.agent.me();
    const status = await client.agent.status();
    return { ...me, ...status } as Me;
  } catch (e: any) {
    console.log(e);
    throw new Error(e);
  }
}
