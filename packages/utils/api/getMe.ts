import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";

export default async function getMe() {
  try {
    const client = await getAd4mClient();
    
    const me = await client.agent.me();
    const status = await client.agent.status();
    return { ...me, ...status };
  } catch (e: any) {
    throw new Error(e);
  }
}
