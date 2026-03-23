import { Ad4mClient, Perspective } from '@coasys/ad4m';

export type Me = {
  did: string;
  perspective?: Perspective;
  directMessageLanguage?: string;
  isUnlocked: boolean;
  isInitialized: boolean;
};

export default async function getMe(client: Ad4mClient): Promise<Me> {
  try {
    const me = await client.agent.me();
    const status = await client.agent.status();
    return { ...me, ...status } as Me;
  } catch (e: any) {
    console.log(e);
    throw new Error(e);
  }
}
