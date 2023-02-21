import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils.js";
import { Perspective } from "@perspect3vism/ad4m";

export interface Me {
  did: string;
  perspective?: Perspective;
  directMessageLanguage?: string;
  isUnlocked: boolean;
  isInitialized: boolean;
}

export default async function getMe(): Promise<Me> {
  try {
    const client = await getAd4mClient();

    const me = await client.agent.me();
    const status = await client.agent.status();
    return { ...me, ...status } as Me;
  } catch (e: any) {
    throw new Error(e);
  }
}
